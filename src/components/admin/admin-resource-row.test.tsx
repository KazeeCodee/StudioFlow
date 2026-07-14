import { render, screen } from "@testing-library/react";
import { AdminResourceRow } from "@/components/admin/admin-resource-row";
import { Table, TableBody, TableCell } from "@/components/ui/table";

describe("AdminResourceRow", () => {
  it("hace que toda la fila navegue al detalle del recurso", () => {
    render(
      <Table>
        <TableBody>
          <AdminResourceRow href="/admin/spaces/space-1" label="Sala Podcast">
            <TableCell>Sala Podcast</TableCell>
          </AdminResourceRow>
        </TableBody>
      </Table>,
    );

    const link = screen.getByRole("link", {
      name: "Ver detalle de Sala Podcast",
    });
    const row = link.closest("tr");

    expect(link).toHaveAttribute("href", "/admin/spaces/space-1");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(row).toHaveClass("relative", "cursor-pointer");
    expect(screen.getByText("Ver detalle")).toBeInTheDocument();
  });
});
