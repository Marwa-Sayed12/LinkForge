import { QRGenerator } from "@/components/QRGenerator";

export default function QRStudio() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">QR Studio</h1>
        <p className="text-sm text-muted-foreground">Create and customize beautiful QR codes.</p>
      </div>
      <QRGenerator hideHeader />
    </div>
  );
}
