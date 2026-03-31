import { SpaceForm } from "@/components/forms/space-form";

export default function NewSpacePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Espacios</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Nuevo espacio</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Configurá disponibilidad semanal, costo por hora en cupos y límites básicos de reserva.
        </p>
      </div>
      <SpaceForm />
    </div>
  );
}
