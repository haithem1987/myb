using Myb.Timesheet.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;
using System.Collections.Generic;

namespace Myb.Timesheet.Services
{
    public class PdfService : IPdfService
    {
        public byte[] GenerateTimesheetPdf(List<TimeSheet> timesheets)
        {
            using var stream = new MemoryStream();

            Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header()
                        .Text("Timesheet Report")
                        .SemiBold().FontSize(24).FontColor(Colors.Blue.Medium);

                    page.Content()
                        .Element(ComposeContent);

                    void ComposeContent(IContainer container)
                    {
                        container.Table(table =>
                        {
                            // Define the number of columns
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                                // Add more columns as necessary
                            });

                            // Add the header row
                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyle).Text("Project").SemiBold();
                                header.Cell().Element(CellStyle).Text("Date").SemiBold();
                                header.Cell().Element(CellStyle).Text("Hours").SemiBold();
                                // Add more header cells as necessary

                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                                }
                            });

                            // Add the data rows
                            foreach (var timesheet in timesheets)
                            {
                                table.Cell().Element(CellStyle).Text(timesheet.ProjectName);
                                table.Cell().Element(CellStyle).Text(timesheet.Date.ToString("yyyy-MM-dd"));
                                table.Cell().Element(CellStyle).Text(timesheet.Quantity.ToString());
                                // Add more cells for other fields as necessary

                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(2);
                                }
                            }
                        });
                    }
                });
            })
            .GeneratePdf(stream);

            return stream.ToArray();
        }
    }
}
