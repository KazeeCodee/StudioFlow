export class RenewalConflictError extends Error {
  constructor() {
    super("El plan fue actualizado por otra operacion. Recarga los datos antes de renovar.");
    this.name = "RenewalConflictError";
  }
}
