export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 text-sm text-muted-foreground md:grid-cols-3">
        <div>
          <h3 className="mb-3 text-foreground">ORVEXA STUDIO</h3>
          <p>Design-led 3D lighting studio focused on modern interiors and smart ambient setups.</p>
        </div>
        <div>
          <h3 className="mb-3 text-foreground">Customer Care</h3>
          <p>Delivery, returns, and gifting support: support@orvexa.co.uk</p>
        </div>
        <div>
          <h3 className="mb-3 text-foreground">Shipping</h3>
          <p>Royal Mail tracked delivery, insured packaging, and UK next-day dispatch options.</p>
        </div>
      </div>
    </footer>
  );
}
