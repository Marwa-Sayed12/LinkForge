
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, MousePointerClick, Globe, Monitor, TrendingUp, Clock, Link2,
  Download, ChevronDown, MapPin, Activity, Users, Zap,
  Smartphone, Laptop, Tablet, Chrome, 
  ChevronRight, Calendar, Eye, Target, PieChart as PieChartIcon
} from "lucide-react";
import '../../css.css';


import iOSIcon from '../../../public/250px-IOS_logo.svg.webp';



import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup
} from "react-simple-maps";
import { scaleQuantize } from "d3-scale";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useClerkAuth";
import { getShortIoStats } from "@/lib/shortio";
import { format, subDays, startOfDay, formatDistance, isToday, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🌍';
  try {
    const code = countryCode.toUpperCase().substring(0, 2);
    const codePoints = code
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌍';
  }
};

const OS_ICONS: Record<string, React.ReactNode> = {
  'Windows': <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="12 -12 48 48">
<path fill="#03a9f4" d="M34.807,12.511l-3.488,12.077c-3.03-2.052-6.327-3.744-13.318-0.83l3.408-11.945l0.041-0.019C28.414,8.908,31.787,10.447,34.807,12.511z"></path><path fill="#ffc107" d="M36.633,13.68l-3.447,11.943c3.028,2.069,6.383,3.718,13.365,0.805l3.324-11.643C42.76,17.24,39.66,15.731,36.633,13.68z"></path><path fill="#ff5722" d="M35.387,10.337l3.441-11.964C35.8-3.688,32.442-5.344,25.454-2.424L22.011,9.59c2.775-1.153,4.969-1.682,6.806-1.666C31.604,7.942,33.563,9.102,35.387,10.337z"></path><path fill="#7cb342" d="M40.643-0.369l-3.44,12.033c3.018,2.063,6.669,3.752,13.359,0.738L54,0.415C47.021,3.317,43.665,1.688,40.643-0.369z"></path>
</svg>,
 
 'Mac OS X': <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
<circle cx="24" cy="25" r="20" fill="#bdbdbd"></circle><circle cx="24" cy="24" r="20" fill="#eceff1"></circle><path fill="#616161" d="M17.031,14.131l0.019,0.455c0.305-0.354,0.716-0.531,1.234-0.531c0.582,0,0.978,0.22,1.189,0.66	c0.138-0.197,0.318-0.356,0.54-0.478c0.222-0.122,0.485-0.182,0.787-0.182c0.912,0,1.377,0.477,1.392,1.429v2.748H21.48v-2.707	c0-0.293-0.067-0.512-0.203-0.658c-0.136-0.145-0.364-0.218-0.685-0.218c-0.264,0-0.483,0.078-0.658,0.233	c-0.174,0.156-0.276,0.365-0.303,0.627v2.722h-0.715v-2.687c0-0.596-0.296-0.895-0.888-0.895c-0.467,0-0.786,0.196-0.958,0.587	v2.995h-0.711v-4.102H17.031z M26.707,17.274v-1.888c-0.01-0.415-0.161-0.74-0.449-0.976s-0.688-0.354-1.198-0.354	c-0.321,0-0.616,0.056-0.885,0.167s-0.481,0.262-0.637,0.453c-0.157,0.191-0.235,0.389-0.235,0.593h0.76	c0-0.179,0.091-0.332,0.274-0.458c0.183-0.126,0.409-0.189,0.679-0.189c0.308,0,0.54,0.073,0.699,0.218	c0.158,0.146,0.237,0.341,0.237,0.586v0.322h-0.736c-0.634,0-1.127,0.118-1.477,0.354s-0.525,0.568-0.525,0.995	c0,0.352,0.139,0.641,0.419,0.87c0.279,0.229,0.637,0.343,1.072,0.343c0.488,0,0.908-0.169,1.259-0.508	c0.027,0.207,0.063,0.351,0.106,0.432h0.793v-0.061C26.759,17.95,26.707,17.651,26.707,17.274z M25.951,17.085	c-0.096,0.182-0.249,0.33-0.463,0.443c-0.212,0.114-0.437,0.17-0.674,0.17c-0.248,0-0.451-0.062-0.609-0.186	c-0.159-0.124-0.237-0.295-0.237-0.516c0-0.503,0.463-0.754,1.39-0.754h0.593V17.085z M29.574,17.736	c0.261,0,0.488-0.076,0.684-0.228c0.195-0.151,0.303-0.341,0.324-0.568h0.691c-0.013,0.235-0.098,0.458-0.253,0.671	s-0.362,0.381-0.622,0.508s-0.534,0.189-0.824,0.189c-0.582,0-1.045-0.186-1.39-0.559c-0.344-0.373-0.516-0.882-0.516-1.529v-0.118	c0-0.399,0.077-0.754,0.229-1.065c0.153-0.311,0.372-0.552,0.658-0.724s0.624-0.258,1.014-0.258c0.479,0,0.878,0.138,1.195,0.413	s0.487,0.633,0.508,1.073h-0.691c-0.021-0.265-0.126-0.483-0.314-0.654s-0.421-0.256-0.697-0.256c-0.371,0-0.659,0.128-0.863,0.385	S28.4,15.644,28.4,16.13v0.132c0,0.473,0.102,0.836,0.305,1.092C28.907,17.609,29.197,17.736,29.574,17.736z M24.106,27.894	c0,1.253-0.243,2.347-0.73,3.281c-0.487,0.934-1.177,1.646-2.068,2.139c-0.893,0.492-1.933,0.738-3.123,0.738	c-1.162,0-2.193-0.247-3.093-0.742c-0.898-0.495-1.597-1.201-2.093-2.117c-0.497-0.917-0.753-1.979-0.765-3.185v-0.923	c0-1.229,0.246-2.316,0.739-3.259c0.494-0.943,1.191-1.665,2.094-2.165c0.902-0.501,1.935-0.751,3.097-0.751	c1.183,0,2.226,0.248,3.128,0.743c0.903,0.495,1.597,1.212,2.084,2.152c0.487,0.94,0.73,2.034,0.73,3.281V27.894z M22.239,27.079	c0-1.517-0.421-2.564-1.124-3.375c-0.703-0.811-1.687-1.217-2.951-1.217c-1.231,0-2.199,0.406-2.904,1.217	c-0.707,0.811-1.139,1.895-1.159,3.335v0.94c0,1.47,0.425,2.384,1.139,3.224c0.712,0.84,1.694,1.261,2.945,1.261	c1.258,0,2.23-0.397,2.92-1.19c0.69-0.794,1.114-1.764,1.134-3.246V27.079z M30.537,26.496c-1.118-0.3-2.92-0.479-2.92-2.13	c0-0.651,0.59-1.918,2.675-1.918c2.303,0,2.768,1.448,2.814,2.118h1.787c-0.037-0.624-0.092-1.206-0.448-1.741	c-0.397-0.597-0.958-1.065-1.681-1.405c-0.724-0.34-1.548-0.51-2.472-0.51c-2.995,0-4.495,1.75-4.495,3.496	c0,0.89,0.264,1.851,0.957,2.457c0.692,0.606,1.759,0.917,3.326,1.312c1.254,0.316,3.205,0.635,3.205,2.469	c0,0.626-0.962,1.884-2.901,1.884c-2.369,0-3.091-1.498-3.134-2.186h-1.788c0.032,0.673,0.431,3.71,4.922,3.71	c3.886,0,4.748-2.578,4.748-3.614C35.133,27.055,31.655,26.795,30.537,26.496z"></path>
</svg>,

  'macOS': <img className="w-5 h-5" alt="svgImg" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciICB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSI0OHB4IiBoZWlnaHQ9IjQ4cHgiPjxwYXRoIGZpbGw9IiM0MkE1RjUiIGQ9Ik00MC4wODQsMzIuNjEzYy0wLjg0OCwxLjgzNS0xLjI1NCwyLjY1NS0yLjM0Miw0LjI3NGMtMS41MjEsMi4yNjQtMy42Nyw1LjA4OS02LjMyNiw1LjEwOWMtMi4zNjEsMC4wMTgtMi45NzEtMS41MDctNi4xNzYtMS40ODJjLTMuMjA0LDAuMDE2LTMuODcyLDEuNTEtNi4yMzcsMS40ODRjLTIuNjU0LTAuMDIyLTQuNjg4LTIuNTY4LTYuMjEtNC44MjZjLTQuMjU5LTYuMzQtNC43MDctMTMuNzY4LTIuMDc2LTE3LjcyMWMxLjg2MS0yLjgwMyw0LjgwNy00LjQ0OSw3LjU3Mi00LjQ0OWMyLjgxNywwLDQuNTg4LDEuNTE0LDYuOTE2LDEuNTE0YzIuMjYyLDAsMy42MzgtMS41MTcsNi44OTYtMS41MTdjMi40NjQsMCw1LjA3LDEuMzEzLDYuOTMxLDMuNTc1QzMyLjk0MiwyMS44MzYsMzMuOTMxLDMwLjMzNyw0MC4wODQsMzIuNjEzeiIvPjxwYXRoIGZpbGw9IiM0MkE1RjUiIGQ9Ik0zMC4wNDYsMTIuMDcyYzEuMjY5LTEuNTc3LDIuMjMyLTMuODA0LDEuODgyLTYuMDcyYy0yLjA2OSwwLjEzOC00LjQ5MSwxLjQxOC01LjkwNSwzLjA3NWMtMS4yODIsMS41MS0yLjM0NSwzLjc1Mi0xLjkzMSw1LjkyMkMyNi4zNTEsMTUuMDY2LDI4LjY4OSwxMy43NjQsMzAuMDQ2LDEyLjA3MnoiLz48cGF0aCBmaWxsPSIjMUU4OEU1IiBkPSJNMzYuNzM2LDIwLjQyMUMyOCwzMC4wMDEsMjAsMjEuMDAxLDkuMjI4LDI3Ljg0MmMwLjM3NSwzLjAyNywxLjUzLDYuMzAzLDMuNTY1LDkuMzMxYzEuNTIxLDIuMjU4LDMuNTU2LDQuODA0LDYuMjEsNC44MjZjMi4zNjUsMC4wMjUsMy4wMzMtMS40NjksNi4yMzctMS40ODRjMy4yMDUtMC4wMjQsMy44MTQsMS41LDYuMTc2LDEuNDgyYzIuNjU2LTAuMDIxLDQuODA1LTIuODQ2LDYuMzI2LTUuMTA5YzEuMDg4LTEuNjE5LDEuNDk0LTIuNDM5LDIuMzQyLTQuMjc0QzM0Ljg3OCwzMC42ODgsMzMuMzg5LDI0LjMxNCwzNi43MzYsMjAuNDIxeiIvPjwvc3ZnPg=="/>,
  'Linux': <img className="w-5 h-5" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg" />,
  'Ubuntu': <img className="w-5 h-5" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ubuntu/ubuntu-original.svg" />,
 
 'iOS': <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
<path fill="#eceff1" d="M16,42h16c5.523,0,10-4.477,10-10V16c0-5.523-4.477-10-10-10H16C10.477,6,6,10.477,6,16v16C6,37.523,10.477,42,16,42z"></path><path fill="#ffc107" d="M12.783 17.974A0.762 0.762 0 1 0 12.783 19.498A0.762 0.762 0 1 0 12.783 17.974Z"></path><path fill="#ff5722" d="M15.982 21.81l1.444-.61c.68-1.22 1.835-1.927 3.332-1.927.34 0 .659.043.962.113l1.372-.579c-.676-.333-1.451-.526-2.334-.526C18.368 18.281 16.663 19.594 15.982 21.81zM13.297 22.944L13.297 21.375 12.273 21.375 12.273 23.377z"></path><path fill="#f44336" d="M13.297 25.733L13.297 22.944 12.273 23.377 12.273 26.165zM16.742 24.148c0-1.169.246-2.163.684-2.948l-1.444.61c-.214.696-.333 1.476-.333 2.338 0 .201.028.382.04.574l1.062-.449C16.75 24.23 16.742 24.192 16.742 24.148zM30.421 18.5c-.279.086-.537.195-.774.327L30.421 18.5zM23.092 18.807l-1.372.579c1.027.237 1.828.863 2.35 1.796l1.022-.432C24.624 19.878 23.941 19.226 23.092 18.807z"></path><path fill="#e91e63" d="M13.297 28.521L13.297 25.733 12.273 26.165 12.273 28.953zM30.421 18.5l-.774.327c-.983.547-1.577 1.464-1.577 2.58 0 .302.046.571.117.825l1.032-.436c-.034-.132-.056-.27-.056-.42 0-1.227 1.117-2.117 2.734-2.117.796 0 1.467.213 1.958.579l1.048-.443c-.694-.684-1.735-1.113-2.974-1.113C31.381 18.281 30.876 18.36 30.421 18.5zM16.75 24.274l-1.062.449c.059.959.26 1.811.597 2.536l1.004-.424C16.954 26.121 16.766 25.26 16.75 24.274zM25.092 20.751l-1.022.432c.381.682.603 1.532.658 2.51l1.061-.448C25.695 22.297 25.467 21.452 25.092 20.751z"></path><g><path fill="#9c27b0" d="M25.609 26.108c.146-.602.242-1.247.242-1.96 0-.316-.033-.609-.063-.904l-1.061.448c.009.153.03.296.03.456 0 .968-.177 1.809-.481 2.523L25.609 26.108zM17.29 26.834l-1.004.424c.408.879 1.008 1.568 1.777 2.038l1.258-.531C18.42 28.427 17.727 27.764 17.29 26.834zM13.297 28.521L12.273 28.953 12.273 29.789 13.297 29.789zM29.22 21.795l-1.032.436c.245.866.915 1.471 2.129 1.889l1.6-.676-.338-.085C30.122 22.995 29.406 22.527 29.22 21.795zM34.719 21.273h1.078c-.05-.731-.379-1.373-.893-1.879l-1.048.443C34.328 20.189 34.635 20.684 34.719 21.273z"></path></g><g><path fill="#3f51b5" d="M25.609 26.108l-1.333.563c-.629 1.476-1.85 2.36-3.519 2.36-.528 0-1.001-.103-1.437-.267l-1.258.531c.752.459 1.648.728 2.695.728C23.3 30.023 25.019 28.541 25.609 26.108zM28.828 26.859H27.75c.026.368.127.705.264 1.021l.989-.418C28.919 27.273 28.853 27.074 28.828 26.859zM32.695 23.641l-.779-.196-1.6.676c.234.081.487.156.762.224l1.289.328c.714.176 1.257.399 1.659.669l1.205-.509C34.703 24.318 33.878 23.934 32.695 23.641z"></path></g><g><path fill="#03a9f4" d="M29.003 27.463l-.989.418c.377.87 1.139 1.531 2.166 1.873l1.692-.714C30.493 29.007 29.415 28.396 29.003 27.463zM35.914 27.333c.035-.193.063-.39.063-.598 0-.784-.234-1.404-.745-1.902l-1.205.509c.579.39.856.883.856 1.51 0 .393-.131.75-.348 1.063L35.914 27.333z"></path></g><path fill="#009688" d="M35.914,27.333l-1.379,0.583c-0.472,0.682-1.394,1.132-2.55,1.132c-0.039,0-0.074-0.006-0.112-0.007l-1.692,0.714c0.514,0.171,1.086,0.269,1.71,0.269C34.098,30.023,35.615,28.964,35.914,27.333z"></path>
</svg>,

  'Android': <img className="w-5 h-5" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg" />,
  'Chrome OS': <img className="w-5 h-5" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/chrome/chrome-original.svg" />,
  'Unknown': <Monitor className="w-5 h-5" />,
};


  const BROWSER_ICONS: Record<string, React.ReactNode> = {
  'Chrome': <img className="w-5 h-5"  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/chrome/chrome-original.svg" />,
  'Firefox': <img className="w-5 h-5"  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firefox/firefox-original.svg" />,
  'Safari': <img className="w-5 h-5"  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/safari/safari-original.svg" />,
  'Edge': <img className="w-5 h-5"  alt="svgImg" src="data:image/png;base64,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" ></img>,
  'Opera':  <img className="w-5 h-5" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/opera/opera-original.svg" />,
  'Internet Explorer': <img alt="svgImg" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciICB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSI0OHB4IiBoZWlnaHQ9IjQ4cHgiPjxwYXRoIGZpbGw9IiMyOUI2RjYiIGQ9Ik0yOS40LDguNGMxLjEtMC43LDUuMy0zLjMsOC44LTMuM2M2LjYsMCwzLjUsNy43LDMuNSw3LjdsMC4yLDAuMkM0NS43LDMuMywzOC40LDQsMzguNCw0Yy00LjEsMC05LjMsMy40LTEwLjQsNC4yYy0xLTAuMS0yLTAuMi0zLjEtMC4yQzkuNyw4LDcuNCwxOS42LDcuMSwyM0M3LDIzLjUsNywyMy44LDcsMjMuOGMwLDAsMCwwLDAsMEM3LDIzLjksNywyNCw3LDI0YzAtMC4xLDAtMC4yLDAtMC4zYzYuMS04LjcsMTQuNS0xMi4yLDE0LjUtMTIuMnYwLjZDOSwyMC42LDYsMzMuMiw1LjMsMzUuN0M0LjUsMzguMyw1LDQ0LDEwLjMsNDRzMTAuNC00LjIsMTAuNC00LjJTMjEuOSw0MCwyNSw0MGMxMy4yLDAsMTYuNy0xMiwxNi43LTEySDMwYzAsMC0xLjIsNC01LjQsNGMtNS44LDAtNS42LTYtNS42LTZoMjNjMC40LTUuNS0xLjEtOS4zLTMuMy0xMS45QzM2LjksMTEuNSwzNCw5LjMsMjkuNCw4LjR6IE0yMCwzOS42YzAsMC03LjgsNC45LTExLjQsMS41Yy0xLjktMy40LDEuMi04LjIsMS4yLTguMlMxMi4yLDM3LjgsMjAsMzkuNnogTTE4LjgsMTAuM0MxOC44LDEwLjMsMTguNywxMC4zLDE4LjgsMTAuM0wxOC44LDEwLjNMMTguOCwxMC4zeiBNMTksMjFjMCwwLTAuMS01LDUuNS01YzUuNCwwLDUuNSw1LDUuNSw1SDE5eiIvPjwvc3ZnPg=="/>,
  'Mobile Safari': <img className="w-5 h-5"  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/safari/safari-original.svg" />,
  'Chrome Mobile': <img className="w-5 h-5"  src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/chrome/chrome-original.svg" />,
  'Unknown': '🌐'
};

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    primary: isDark ? "#4ADE80" : "#1FB07E",
    secondary: isDark ? "#60A5FA" : "#0B9BD7",
    accent: isDark ? "#FBBF24" : "#E8A317",
    success: isDark ? "#34D399" : "#46A758",
    grid: isDark ? "#2D3039" : "#E2E5EB",
    text: isDark ? "#9CA3AF" : "#6B7280",
    tooltipBg: isDark ? "#1F2937" : "#FFFFFF",
    tooltipBorder: isDark ? "#374151" : "#E5E7EB",
    tooltipText: isDark ? "#F9FAFB" : "#111827",
    chartColors: ["#1FB07E", "#0B9BD7", "#E8A317", "#E5484D", "#8B5CF6", "#EC4899", "#06B6D4", "#F59E0B"],
    mapColors: {
      light: ["#E8F5E9", "#C8E6C9", "#A5D6A7", "#81C784", "#66BB6A", "#4CAF50", "#43A047", "#388E3C", "#2E7D32", "#1B5E20"],
      dark: ["#1B5E20", "#2E7D32", "#388E3C", "#43A047", "#4CAF50", "#66BB6A", "#81C784", "#A5D6A7", "#C8E6C9", "#E8F5E9"]
    }
  };
}

interface LinkWithStats {
  id: string;
  short_code: string;
  short_url: string;
  original_url: string;
  title: string | null;
  clicks: number;
  stats?: any;
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg p-3 max-w-[200px]">
        <p className="text-sm font-semibold text-foreground mb-1">{data.fullDate || label}</p>
        <p className="text-sm text-primary font-medium">
          {payload[0].value} clicks
        </p>
        {data.isToday && (
          <p className="text-[10px] text-primary/80 mt-1">📍 Today</p>
        )}
      </div>
    );
  }
  return null;
};

const WorldMap = ({ data }: { data: any[] }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(1.2);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = useChartColors();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 1;
  
  const colorScale = scaleQuantize<string>()
    .domain([0, maxValue])
    .range(isDark ? colors.mapColors.dark : colors.mapColors.light);

  const getCountryColor = (countryCode: string) => {
    const country = data.find(d => d.code === countryCode);
    if (!country || country.value === 0) {
      return isDark ? "#8fa6a3" : "#cfe2e0";
    }
    return colorScale(country.value);
  };

  const getCountryName = (countryCode: string) => {
    const country = data.find(d => d.code === countryCode);
    return country ? country.name : countryCode;
  };

  const getCountryClicks = (countryCode: string) => {
    const country = data.find(d => d.code === countryCode);
    return country ? country.value : 0;
  };

  const coords: Record<string, [number, number]> = {
    'US': [-100, 40],
    'AF': [67, 33],
    'GB': [-3, 55],
    'CA': [-100, 55],
    'AU': [134, -25],
    'DE': [10, 51],
    'FR': [2, 47],
    'IN': [78, 20],
    'JP': [138, 36],
    'BR': [-55, -15],
    'ZA': [25, -30],
    'PK': [70, 30],
    'NG': [8, 10],
    'EG': [30, 26],
    'SA': [45, 24],
    'AE': [54, 24],
    'TR': [35, 39],
    'RU': [90, 60],
    'CN': [105, 35],
    'IT': [12, 42],
    'ES': [-4, 40],
    'NL': [5, 52],
    'SE': [15, 60],
    'NO': [10, 60],
    'DK': [10, 56],
    'FI': [25, 60],
    'IE': [-8, 53],
    'PT': [-8, 40],
    'GR': [22, 38],
    'PL': [19, 52],
    'UA': [31, 49],
    'RO': [25, 46],
    'HU': [19, 47],
    'AT': [14, 47],
    'CH': [8, 47],
    'BE': [4, 50],
    'CZ': [15, 50],
    'SK': [19, 49],
    'SI': [15, 46],
    'HR': [16, 45],
    'RS': [21, 44],
    'BG': [25, 43],
  };

  return (
    <div className={`map-container ${isDark ? 'map-container-dark' : 'map-container-light'}`}>
      <div className="map-overlay" />

      <ComposableMap
        projectionConfig={{
          scale: isMobile ? 60 * zoom : 100 * zoom,
          center: [0, 20]
        }}
        className="w-full h-full"
      >
        <ZoomableGroup zoom={zoom}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = geo.id;
                const color = getCountryColor(countryCode);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={color}
                    stroke={isDark ? "#bfd5d2" : "#a6aeac"}
                    strokeWidth={1.2}
                    style={{
                      default: {
                        outline: "none",
                        transition: "all 0.3s ease"
                      },
                      hover: {
                        fill: isDark ? "#4ADE80" : "#1FB07E",
                        outline: "none",
                        cursor: "pointer",
                        stroke: isDark ? "#4ADE80" : "#1FB07E",
                        strokeWidth: 2
                      },
                      pressed: {
                        outline: "none"
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
          {data.length > 0 && data.map((country) => {
            const position = coords[country.code];
            if (!position) return null;
            
            const size = Math.max(4, Math.min(10, country.value / maxValue * 8 + 3));
            
            return (
              <Marker key={country.code} coordinates={position}>
                <circle
                  r={size}
                  fill={isDark ? "#4ADE80" : "#1FB07E"}
                  stroke={isDark ? "#1FB07E" : "#FFFFFF"}
                  strokeWidth={1.5}
                  className="animate-pulse"
                  style={{
                    opacity: 0.9,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
                <circle
                  r={size * 1.6}
                  fill={isDark ? "#4ADE80" : "#1FB07E"}
                  fillOpacity={0.15}
                  stroke="none"
                  className="animate-ping"
                  style={{
                    animationDuration: '2s'
                  }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="map-zoom-controls">
        <button 
          className="map-zoom-btn" 
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button 
          className="map-zoom-btn" 
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button 
          className="map-zoom-btn map-zoom-reset" 
          onClick={handleZoomReset}
          aria-label="Reset zoom"
          title="Reset zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9m0 0v6m0-6h-6"/>
          </svg>
        </button>
      </div>
      
      {data.length > 0 && (
        <div className="map-legend">
          <div className="flex items-center gap-2">
            <span className="legend-text">Low</span>
            <div className="legend-colors">
              {(isDark ? colors.mapColors.dark : colors.mapColors.light).slice(0, 7).map((color, i) => (
                <div key={i} className="legend-color-bar" style={{ backgroundColor: color }} />
              ))}
            </div>
            <span className="legend-text">High</span>
          </div>
        </div>
      )}
      
      {data.length > 0 && (
        <div className="map-badge">
          <span className="map-badge-text">🌍 {data.length} {data.length === 1 ? 'Country' : 'Countries'}</span>
        </div>
      )}

      {data.length > 0 && (
        <div className="map-watermark">
          <span className="map-watermark-text">LinkForge Analytics</span>
        </div>
      )}
    </div>
  );
};

export default function Analytics() {
  const { user } = useAuth();
  const colors = useChartColors();

  const [links, setLinks] = useState<LinkWithStats[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalLinks, setTotalLinks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyClicksData, setDailyClicksData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [browserData, setBrowserData] = useState<any[]>([]);
  const [osData, setOsData] = useState<any[]>([]);
  const [recentClicks, setRecentClicks] = useState<any[]>([]);
  const [clicksToday, setClicksToday] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [totalHumanClicks, setTotalHumanClicks] = useState(0);
  const [referrerData, setReferrerData] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const processStatsData = useCallback((allStats: any[], total: number, humanTotal: number) => {
    const dailyMap: Record<string, number> = {};
    const now = new Date();
    let todayCount = 0;

    allStats.forEach((stats) => {
      if (stats.clickStatistics && stats.clickStatistics.datasets) {
        const dataset = stats.clickStatistics.datasets[0];
        if (dataset && dataset.data) {
          dataset.data.forEach((item: any) => {
            const countNum = typeof item.y === 'string' ? parseInt(item.y) : (item.y || 0);
            if (countNum > 0) {
              try {
                let parsedDate: Date | null = null;
                
                if (typeof item.x === 'string') {
                  const dateStr = item.x;
                  const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
                  if (dateMatch) {
                    parsedDate = new Date(
                      parseInt(dateMatch[1]),
                      parseInt(dateMatch[2]) - 1,
                      parseInt(dateMatch[3])
                    );
                  } else {
                    parsedDate = new Date(dateStr);
                  }
                } else if (item.x instanceof Date) {
                  parsedDate = item.x;
                }
                
                if (parsedDate && !isNaN(parsedDate.getTime())) {
                  const formattedDate = format(parsedDate, 'yyyy-MM-dd');
                  dailyMap[formattedDate] = (dailyMap[formattedDate] || 0) + countNum;
                  
                  const today = new Date();
                  if (parsedDate.getFullYear() === today.getFullYear() &&
                      parsedDate.getMonth() === today.getMonth() &&
                      parsedDate.getDate() === today.getDate()) {
                    todayCount += countNum;
                  }
                }
              } catch (e) {
                console.warn('⚠️ Error parsing date:', item.x, e);
              }
            }
          });
        }
      }
      
      if (stats.clicksByDate) {
        Object.entries(stats.clicksByDate).forEach(([date, count]: [string, any]) => {
          const countNum = typeof count === 'number' ? count : 0;
          if (countNum > 0 && !dailyMap[date]) {
            dailyMap[date] = countNum;
          }
        });
      }
    });

    if (Object.keys(dailyMap).length === 0 && total > 0) {
      const todayStr = format(now, 'yyyy-MM-dd');
      dailyMap[todayStr] = total;
      todayCount = total;
    }

    setClicksToday(todayCount);

    const days: { date: string; clicks: number; fullDate: string; isToday: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const label = format(date, "MMM d");
      const dateStr = format(date, "yyyy-MM-dd");
      days.push({
        date: label,
        fullDate: format(date, "EEEE, MMMM d, yyyy"),
        clicks: dailyMap[dateStr] || 0,
        isToday: i === 0,
      });
    }
    setDailyClicksData(days);

const deviceMap: Record<string, number> = {};
allStats.forEach((stats) => {
  if (stats.devices) {
    Object.entries(stats.devices).forEach(([device, count]: [string, any]) => {
      const countNum = typeof count === 'number' ? count : 0;
      if (countNum > 0) {
        let cleanDevice = device;
        const deviceLower = device.toLowerCase();
        
        if (deviceLower.includes('mobile') || 
            deviceLower.includes('phone') || 
            deviceLower.includes('android') || 
            deviceLower.includes('ios') || 
            deviceLower.includes('iphone') || 
            deviceLower.includes('ipod') ||
            deviceLower.includes('android') ||
            deviceLower.includes('huawei') ||
            deviceLower.includes('samsung') ||
            deviceLower.includes('pixel')) {
          cleanDevice = '📱 Mobile';
        } else if (deviceLower.includes('tablet') || 
                   deviceLower.includes('ipad')) {
          cleanDevice = '📱 Tablet';
        } else if (deviceLower.includes('desktop') || 
                   deviceLower.includes('pc') || 
                   deviceLower.includes('laptop') || 
                   deviceLower.includes('mac') ||
                   deviceLower.includes('windows') || 
                   deviceLower.includes('linux')) {
          cleanDevice = '💻 Desktop';
        } else {
          let isMobileBrowser = false;
          if (stats.browsers) {
            Object.keys(stats.browsers).forEach((browser) => {
              const browserLower = browser.toLowerCase();
              if (browserLower.includes('mobile') || 
                  browserLower.includes('android') || 
                  browserLower.includes('ios')) {
                isMobileBrowser = true;
              }
            });
          }
          cleanDevice = isMobileBrowser ? '📱 Mobile' : '💻 ' + device;
        }
        deviceMap[cleanDevice] = (deviceMap[cleanDevice] || 0) + countNum;
      }
    });
  }
});

    if (Object.keys(deviceMap).length === 0 && total > 0) {
      let hasMobile = false;
      let hasDesktop = false;
      
      allStats.forEach((stats) => {
        if (stats.browsers) {
          Object.keys(stats.browsers).forEach((browser) => {
            const browserLower = browser.toLowerCase();
            if (browserLower.includes('mobile') || browserLower.includes('android') || 
                browserLower.includes('ios') || browserLower.includes('safari mobile')) {
              hasMobile = true;
            } else {
              hasDesktop = true;
            }
          });
        }
        if (stats.oss) {
          Object.keys(stats.oss).forEach((os) => {
            const osLower = os.toLowerCase();
            if (osLower.includes('android') || osLower.includes('ios') || 
                osLower.includes('iphone') || osLower.includes('ipad')) {
              hasMobile = true;
            } else {
              hasDesktop = true;
            }
          });
        }
      });
      
      if (hasMobile && hasDesktop) {
        deviceMap['📱 Mobile'] = Math.round(total * 0.4);
        deviceMap['💻 Desktop'] = Math.round(total * 0.6);
      } else if (hasMobile) {
        deviceMap['📱 Mobile'] = total;
      } else {
        deviceMap['💻 Desktop'] = total;
      }
    }
    
    setDeviceData(
      Object.entries(deviceMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    const countryMap: Record<string, { count: number; code: string }> = {};
    allStats.forEach((stats) => {
      if (stats.countries) {
        Object.entries(stats.countries).forEach(([country, data]: [string, any]) => {
          const countNum = typeof data === 'number' ? data : data?.count || 0;
          const countryCode = typeof data === 'object' ? data.code : country;
          if (countNum > 0) {
            const fullName = country;
            if (!countryMap[fullName]) {
              countryMap[fullName] = { count: 0, code: countryCode };
            }
            countryMap[fullName].count += countNum;
          }
        });
      }
    });
    
    if (Object.keys(countryMap).length === 0 && total > 0) {
      countryMap['United States'] = { count: total, code: 'US' };
    }
    
    setCountryData(
      Object.entries(countryMap)
        .map(([name, data]) => ({ 
          name, 
          value: data.count,
          code: data.code 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    const browserMap: Record<string, { count: number; icon: string }> = {};
    allStats.forEach((stats) => {
      if (stats.browsers) {
        Object.entries(stats.browsers).forEach(([browser, data]: [string, any]) => {
          const countNum = typeof data === 'number' ? data : data?.count || 0;
          const icon = typeof data === 'object' ? data.icon : BROWSER_ICONS[browser] || '🌐';
          if (countNum > 0) {
            if (!browserMap[browser]) {
              browserMap[browser] = { count: 0, icon };
            }
            browserMap[browser].count += countNum;
          }
        });
      }
    });
    
    if (Object.keys(browserMap).length === 0 && total > 0) {
      browserMap['Chrome'] = { count: total, icon: '🌐' };
    }
    
    setBrowserData(
      Object.entries(browserMap)
        .map(([name, data]) => ({ 
          name, 
          value: data.count,
          icon: data.icon 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    const osMap: Record<string, { count: number; icon: string }> = {};
    allStats.forEach((stats) => {
      if (stats.oss) {
        Object.entries(stats.oss).forEach(([os, data]: [string, any]) => {
          const countNum = typeof data === 'number' ? data : data?.count || 0;
          const icon = typeof data === 'object' ? data.icon : OS_ICONS[os] || '💻';
          if (countNum > 0) {
            if (!osMap[os]) {
              osMap[os] = { count: 0, icon };
            }
            osMap[os].count += countNum;
          }
        });
      }
    });
    
    if (Object.keys(osMap).length === 0 && total > 0) {
      osMap['Windows'] = { count: total, icon: '🪟' };
    }
    
    setOsData(
      Object.entries(osMap)
        .map(([name, data]) => ({ 
          name, 
          value: data.count,
          icon: data.icon 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

    const referrerMap: Record<string, number> = {};
    allStats.forEach((stats) => {
      if (stats.referrers) {
        Object.entries(stats.referrers).forEach(([referrer, count]: [string, any]) => {
          const countNum = typeof count === 'number' ? count : count?.count || 0;
          if (countNum > 0) {
            referrerMap[referrer] = (referrerMap[referrer] || 0) + countNum;
          }
        });
      }
    });
    
    if (Object.keys(referrerMap).length === 0 && total > 0) {
      referrerMap['Direct'] = total;
    }
    
    setReferrerData(
      Object.entries(referrerMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    );

  
    const allRecentClicks: any[] = [];

    allStats.forEach((stats) => {
      if (stats.recentClicks && Array.isArray(stats.recentClicks) && stats.recentClicks.length > 0) {
        stats.recentClicks.forEach((click: any) => {
          let deviceType = 'Desktop';
          let deviceIcon = '💻';
          
          const userAgent = (click.userAgent || click.user_agent || click.ua || '').toLowerCase();
          const device = (click.device || click.device_type || '').toLowerCase();
          
          const isMobile = userAgent.includes('mobile') || 
                 userAgent.includes('android') || 
                 userAgent.includes('iphone') || 
                 userAgent.includes('ipod') ||
                 userAgent.includes('blackberry') ||
                 device.includes('mobile') ||
                 device.includes('phone');

          const isTablet = userAgent.includes('tablet') || 
                 userAgent.includes('ipad') ||
                 device.includes('tablet') ||
                 device.includes('ipad');

          if (isMobile && !isTablet) {
            deviceType = '📱 Mobile';
            deviceIcon = '📱';
          } else if (isTablet) {
            deviceType = '📱 Tablet';
            deviceIcon = '📱';
          } else {
            deviceType = '💻 Desktop';
            deviceIcon = '💻';
          }
          
          let os = click.os || click.operating_system || 'Unknown';
          if (userAgent.includes('windows')) os = 'Windows';
          else if (userAgent.includes('mac')) os = 'macOS';
          else if (userAgent.includes('linux')) os = 'Linux';
          else if (userAgent.includes('android')) os = 'Android';
          else if (userAgent.includes('ios') || userAgent.includes('iphone')) os = 'iOS';
          
          let browser = click.browser || 'Unknown';
          if (userAgent.includes('chrome') && !userAgent.includes('edg')) browser = 'Chrome';
          else if (userAgent.includes('firefox')) browser = 'Firefox';
          else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'Safari';
          else if (userAgent.includes('edg')) browser = 'Edge';
          
          const country = click.country || click.country_code || null;
          const city = click.city || null;
          
          allRecentClicks.push({
            ...click,
            clicked_at: click.timestamp || click.clicked_at || new Date().toISOString(),
            browser: browser,
            device_type: deviceType,
            device_icon: deviceIcon,
            os: os,
            country: country,
            city: city,
            userAgent: userAgent,
          });
        });
      }
    });

    if (allRecentClicks.length === 0 && total > 0) {
      const countries: string[] = [];
      const countryCodes: Record<string, string> = {};
      
      allStats.forEach((stats) => {
        if (stats.countries) {
          Object.entries(stats.countries).forEach(([name, data]: [string, any]) => {
            if (!countries.includes(name)) {
              countries.push(name);
              countryCodes[name] = data.code || null;
            }
          });
        }
      });
      
      const browsers: string[] = [];
      allStats.forEach((stats) => {
        if (stats.browsers) {
          Object.keys(stats.browsers).forEach((name) => {
            if (!browsers.includes(name)) {
              browsers.push(name);
            }
          });
        }
      });
      
      const oss: string[] = [];
      allStats.forEach((stats) => {
        if (stats.oss) {
          Object.keys(stats.oss).forEach((name) => {
            if (!oss.includes(name)) {
              oss.push(name);
            }
          });
        }
      });
      
      const maxItems = Math.min(10, Math.max(countries.length || 1, browsers.length || 1, oss.length || 1));
      for (let i = 0; i < maxItems; i++) {
        const country = countries[i % countries.length] || 'Unknown';
        const browser = browsers[i % browsers.length] || 'Chrome';
        const os = oss[i % oss.length] || 'Windows';
        
        let deviceType = '💻 Desktop';
        const osLower = os.toLowerCase();
        if (osLower.includes('android') || osLower.includes('ios') || osLower.includes('iphone')) {
          deviceType = '📱 Mobile';
        }
        
        const browserLower = browser.toLowerCase();
        if (browserLower.includes('mobile')) {
          deviceType = '📱 Mobile';
        }
        
        allRecentClicks.push({
          clicked_at: new Date(Date.now() - i * 3600000).toISOString(),
          browser: browser,
          device_type: deviceType,
          os: os,
          country: country,
          country_code: countryCodes[country] || null,
          city: null,
          userAgent: '',
        });
      }
    }

    if (allRecentClicks.length === 0 && total > 0) {
      allRecentClicks.push({
        clicked_at: new Date().toISOString(),
        browser: "Chrome",
        device_type: "💻 Desktop",
        os: "Windows",
        country: "Afghanistan",
        country_code: "AF",
        city: null,
        userAgent: '',
      });
    }

    setRecentClicks(
      allRecentClicks
        .sort((a, b) => new Date(b.clicked_at).getTime() - new Date(a.clicked_at).getTime())
        .slice(0, 10)
    );
  }, []);

  const fetchAnalytics = useCallback(async (refresh = false) => {
    if (!user) return;

    if (refresh) {
      setIsRefreshing(true);
    }

    setLoading(true);
    setProgress(0);

    try {
      const { data: userLinks, error: linksError } = await supabase
        .from("links")
        .select("id, short_code, original_url, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (linksError) {
        console.error("Error fetching links:", linksError);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      setTotalLinks(userLinks?.length || 0);

      if (userLinks && userLinks.length > 0) {
        const linksWithStats: LinkWithStats[] = [];
        let total = 0;
        let humanTotal = 0;
        const allStats: any[] = [];

        for (const link of userLinks) {
          try {
            const shortUrl = `https://s.linkforge.website/${link.short_code}`;
            const stats = await getShortIoStats(link.short_code);
            
            if (stats) {
              const clickCount = stats.totalClicks || stats.clicks || 0;
              total += clickCount;
              humanTotal += stats.humanClicks || clickCount;
              
              linksWithStats.push({
                ...link,
                short_url: shortUrl,
                clicks: clickCount,
                stats: stats,
              });
              
              allStats.push(stats);
            } else {
              linksWithStats.push({
                ...link,
                short_url: shortUrl,
                clicks: 0,
              });
            }
          } catch (error) {
            console.error("Error fetching stats for link:", link.short_code, error);
            linksWithStats.push({
              ...link,
              short_url: `https://s.linkforge.website/${link.short_code}`,
              clicks: 0,
            });
          }
        }

        setLinks(linksWithStats);
        setTotalClicks(total);
        setTotalHumanClicks(humanTotal);
        setProgress(100);

        processStatsData(allStats, total, humanTotal);
      } else {
        setLinks([]);
        setTotalClicks(0);
        setTotalHumanClicks(0);
        setDailyClicksData([]);
        setDeviceData([]);
        setCountryData([]);
        setBrowserData([]);
        setOsData([]);
        setReferrerData([]);
        setRecentClicks([]);
        setClicksToday(0);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [user, processStatsData]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = useCallback(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const headers = ["Short Code", "Original URL", "Clicks", "Browsers", "Devices", "Countries"];
      const rows = links.map(link => [
        link.short_code,
        link.original_url,
        link.clicks,
        link.stats?.browsers ? Object.keys(link.stats.browsers).join(", ") : "",
        link.stats?.devices ? Object.keys(link.stats.devices).join(", ") : "",
        link.stats?.countries ? Object.keys(link.stats.countries).join(", ") : "",
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
    setIsExporting(false);
  };

  const stats = [
    { label: "Total Clicks", value: totalClicks, icon: MousePointerClick, color: "text-primary", bg: "bg-primary/10" },
    { label: "Human Clicks", value: totalHumanClicks, icon: Users, color: "text-info", bg: "bg-info/10" },
    { label: "Total Links", value: totalLinks, icon: Link2, color: "text-accent", bg: "bg-accent/10" },
    { label: "Countries", value: countryData.length, icon: Globe, color: "text-success", bg: "bg-success/10" },
    { label: "Devices", value: deviceData.length, icon: Monitor, color: "text-primary", bg: "bg-primary/10" },
    { label: "Browsers", value: browserData.length, icon: Chrome, color: "text-info", bg: "bg-info/10" },
  ];

  if (loading && !isRefreshing) {
    return <AnalyticsSkeleton progress={progress} />;
  }

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: "8px",
    color: colors.tooltipText,
    fontSize: 12,
    padding: "8px 12px",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle}>
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} clicks
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6 px-3 md:px-4 lg:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Real-time performance from Short.io</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="text-xs md:text-sm">
            {isRefreshing ? (
              <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1 md:mr-2" />
            ) : (
              <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || totalClicks === 0} className="text-xs md:text-sm">
            <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {isRefreshing && progress > 0 && progress < 100 && (
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 min-h-[100px]">
            {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-xl p-3 md:p-4 ${stat.bg} border border-border/50 hover:border-primary/20 transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
              <span className="text-lg md:text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</span>
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {totalClicks === 0 && links.length === 0 ? (
        <div className="glass-card rounded-xl p-8 md:p-12 text-center">
          <BarChart3 className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
          <h3 className="font-heading text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">No analytics yet</h3>
          <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
            Share your links to start seeing click analytics.
          </p>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-3 md:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
              <h3 className="font-heading font-semibold text-foreground text-base md:text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Clicks Over Time
              </h3>
              <div className="flex items-center gap-2">
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
              <AreaChart 
                data={dailyClicksData}
                margin={{ top: 10, right: 5, left: isMobile ? -15 : 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis 
                  dataKey="date" 
                  fontSize={isMobile ? 8 : 10} 
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                  interval={isMobile ? 4 : 2}
                  tickMargin={isMobile ? 4 : 8}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 40 : 30}
                />
                <YAxis 
                  stroke={colors.text} 
                  fontSize={isMobile ? 8 : 10} 
                  allowDecimals={false} 
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                  domain={[0, 'auto']}
                  width={isMobile ? 25 : 35}
                />
                <Tooltip content={CustomChartTooltip} />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke={colors.primary} 
                  fill="url(#clickGradient)" 
                  strokeWidth={isMobile ? 2 : 2.5}
                  activeDot={{ 
                    r: isMobile ? 4 : 6, 
                    fill: colors.primary,
                    stroke: colors.tooltipBg,
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6 mt-2 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                Total: <span className="font-semibold text-foreground">{totalClicks}</span>
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                Today: <span className="font-semibold text-primary">{clicksToday}</span>
              </span>
              {dailyClicksData.length > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  Peak: <span className="font-semibold text-accent">
                    {Math.max(...dailyClicksData.map(d => d.clicks))} clicks
                  </span>
                </span>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-success" />
                Top Performing Links
              </h3>
              <div className="space-y-2 md:space-y-3">
                {links.filter(l => l.clicks > 0).length === 0 ? (
                  <p className="text-xs md:text-sm text-muted-foreground text-center py-3 md:py-4">No clicks yet.</p>
                ) : (
                  links
                    .filter(l => l.clicks > 0)
                    .sort((a, b) => b.clicks - a.clicks)
                    .slice(0, 5)
                    .map((link, i) => (
                      <div key={link.id} className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors">
                        <span className="text-[10px] md:text-xs font-mono text-muted-foreground w-5 md:w-6 text-right font-bold">
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm font-medium text-foreground truncate">
                            {link.title || link.short_code}
                          </div>
                          <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                            {link.original_url}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs md:text-sm font-mono font-semibold text-primary">
                          <MousePointerClick className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {link.clicks.toLocaleString()}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>

                    {deviceData.length > 0 && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-3 md:p-6">
    <h3 className="font-heading font-semibold text-foreground mb-2 md:mb-4 text-sm md:text-lg flex items-center gap-2">
      <PieChartIcon className="w-4 h-4 md:w-5 md:h-5 text-info" />
      Device Distribution
    </h3>
    
    <div className="h-[260px] sm:h-[240px] md:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={deviceData} 
            cx="50%" 
            cy="50%" 
            innerRadius={isMobile ? 40 : 55}
            outerRadius={isMobile ? 75 : 100}
            dataKey="value" 
            paddingAngle={3}
            label={({ name, percent }) => {
              if (window.innerWidth < 480) return '';
              return (percent * 100) > 5 ? `${name} ${(percent * 100).toFixed(0)}%` : '';
            }}
            labelLine={false}
          >
            {deviceData.map((entry, index) => (
              <Cell key={entry.name} fill={colors.chartColors[index % colors.chartColors.length]} />
            ))}
          </Pie>
          <Tooltip content={CustomTooltip} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
      {deviceData.map((entry, index) => (
        <div 
          key={entry.name} 
          className="flex items-center gap-1.5 sm:gap-2 text-xs xs:text-sm sm:text-sm md:text-base whitespace-nowrap px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-secondary/20 border border-border/30"
        >
          <span 
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: colors.chartColors[index % colors.chartColors.length] }} 
          />
          <span className="font-medium text-xs xs:text-sm sm:text-sm md:text-base">{entry.name}</span>
          <span className="font-bold text-xs xs:text-sm sm:text-sm md:text-base">{entry.value}</span>
        </div>
      ))}
    </div>
  </motion.div>
)}
          </div>

          {countryData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <div className="section-header">
                <h3 className="section-title text-base md:text-lg">
                  <Globe className="w-4 h-4 md:w-5 md:h-5 text-success" />
                  Global Reach
                </h3>
                <span className="section-subtitle text-xs md:text-sm">
                  {countryData.reduce((sum, c) => sum + c.value, 0)} total clicks
                </span>
              </div>
              
              <WorldMap data={countryData} />
              
              <div className="country-grid">
                {countryData.slice(0, 8).map((country) => {
                  return (
                    <div 
                      key={country.name} 
                      className="country-card"
                    >
                      <div className="flex items-center min-w-0">
                        <span className="country-flag">{getFlagEmoji(country.code || '')}</span>
                        <span className="country-name">{country.name}</span>
                      </div>
                      <span className="country-clicks">{country.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {browserData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <Monitor className="w-4 h-4 md:w-5 md:h-5 text-info" />
                Top Browsers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {browserData.slice(0, 6).map((b) => {
                  const maxVal = browserData[0]?.value || 1;
                  const pct = Math.round((b.value / maxVal) * 100);
                  return (
                    <div key={b.name} className="p-2 md:p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-foreground flex items-center gap-1 md:gap-2">
                          <span className="text-base md:text-xl">{b.icon || '🌐'}</span>
                          <span className="font-medium text-xs md:text-sm truncate">{b.name}</span>
                        </span>
                        <span className="font-mono text-[10px] md:text-xs text-muted-foreground">{b.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 md:h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: colors.secondary }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {osData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <Monitor className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                Operating Systems
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {osData.slice(0, 6).map((o) => {
                  const maxVal = osData[0]?.value || 1;
                  const pct = Math.round((o.value / maxVal) * 100);
                  return (
                    <div key={o.name} className="p-2 md:p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-foreground flex items-center gap-1 md:gap-2">
                          <span className="text-base md:text-xl">{o.icon || '💻'}</span>
                          <span className="font-medium text-xs md:text-sm truncate">{o.name}</span>
                        </span>
                        <span className="font-mono text-[10px] md:text-xs text-muted-foreground">{o.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 md:h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: colors.accent }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {referrerData.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 md:p-6">
              <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-base md:text-lg flex items-center gap-2">
                <Link2 className="w-4 h-4 md:w-5 md:h-5 text-success" />
                Top Referrers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {referrerData.slice(0, 6).map((r) => {
                  const maxVal = referrerData[0]?.value || 1;
                  const pct = Math.round((r.value / maxVal) * 100);
                  return (
                    <div key={r.name} className="p-2 md:p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-foreground truncate font-medium text-xs md:text-sm">{r.name || "Direct"}</span>
                        <span className="font-mono text-[10px] md:text-xs text-muted-foreground">{r.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 md:h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: colors.success }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          
        </>
      )}
    </div>
  );
}

function AnalyticsSkeleton({ progress = 0 }) {
  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <Skeleton className="h-6 md:h-8 w-24 md:w-32 shimmer-card" />
          <Skeleton className="h-3 md:h-4 w-32 md:w-48 mt-1 shimmer-card" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 md:h-9 w-20 md:w-28 shimmer-card" />
          <Skeleton className="h-8 md:h-9 w-16 md:w-20 shimmer-card" />
        </div>
      </div>
      
      {progress > 0 && (
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 min-h-[100px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-3 md:p-4 border border-border/50 shimmer-card">
            <Skeleton className="h-4 w-4 md:h-5 md:w-5 mb-1 md:mb-2" />
            <Skeleton className="h-5 md:h-8 w-10 md:w-16" />
            <Skeleton className="h-2 md:h-3 w-14 md:w-20 mt-0.5" />
          </div>
        ))}
      </div>
      <div className="glass-card rounded-xl p-4 md:p-5 border border-border/50 min-h-[250px]">
        <Skeleton className="h-5 md:h-6 w-28 md:w-40 mb-3 md:mb-4" />
        <Skeleton className="h-[200px] md:h-[300px] w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Skeleton className="h-48 md:h-64 w-full rounded-xl" />
        <Skeleton className="h-48 md:h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}