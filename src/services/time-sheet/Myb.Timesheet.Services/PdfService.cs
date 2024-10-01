using Myb.Timesheet.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;
using System.Collections.Generic;
using System.Linq;

namespace Myb.Timesheet.Services
{
    public class PdfService : IPdfService
    {
        public byte[] GenerateTimesheetPdf(List<TimeSheet> timesheets)
        {
            using var stream = new MemoryStream();

            // Group timesheets by projectId
            var groupedTimesheets = timesheets.GroupBy(ts => ts.ProjectId);

            Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header().Element(ComposeHeader);

                    page.Content().Element(ComposeContent);

                    void ComposeHeader(IContainer container)
                    {
                        container.AlignCenter().Text("MYB - Manage Your Business")
                            .SemiBold().FontSize(32).FontColor(Colors.Blue.Medium);
                    }

                    void ComposeContent(IContainer container)
                    {
                        container.Column(column =>
                        {
                            column.Spacing(20); // Add spacing between project groups

                            foreach (var projectGroup in groupedTimesheets)
                            {
                                // For each project group, create its own section
                                column.Item().Element(innerContainer =>
                                {
                                    innerContainer.Column(projectColumn =>
                                    {
                                        projectColumn.Spacing(10);

                                        // Project name that spans all columns (using "colspan" effect)
                                        projectColumn.Item().Text($"Project: {projectGroup.First().ProjectName} (ID: {projectGroup.Key})")
                                            .SemiBold().FontSize(18).FontColor(Colors.Black).BackgroundColor(Colors.Grey.Lighten3).ParagraphSpacing(5); // We can style this differently to make it stand out

                                        // Table for the current project group
                                        projectColumn.Item().Element(ComposeProjectTable);

                                        void ComposeProjectTable(IContainer tableContainer)
                                        {
                                            tableContainer.Table(table =>
                                            {
                                                // Define the number of columns
                                                table.ColumnsDefinition(columns =>
                                                {
                                                    columns.RelativeColumn(2); // Username
                                                    columns.RelativeColumn(2); // Username
                                                    columns.RelativeColumn(3); // Date
                                                    columns.RelativeColumn(2); // Hours
                                                });

                                                // Add the header row for each project group
                                                table.Header(header =>
                                                {
                                                    header.Cell().Element(CellStyle).Text("Day").SemiBold();
                                                    header.Cell().Element(CellStyle).Text("Date").SemiBold();
                                                    header.Cell().Element(CellStyle).Text("Username").SemiBold();
                                                    header.Cell().Element(CellStyle).Text("Hours").SemiBold();

                                                    static IContainer CellStyle(IContainer container)
                                                    {
                                                        return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                                                    }
                                                });

                                                // Add rows for each timesheet in the group
                                                foreach (var timesheet in projectGroup)
                                                {
                                                    table.Cell().Element(CellStyle).Text(timesheet.Date.ToString("dddd")); 
                                                    table.Cell().Element(CellStyle).Text(timesheet.Date.ToString("yyyy-MM-dd")); 
                                                    table.Cell().Element(CellStyle).Text(timesheet.Username);
                                                    table.Cell().Element(CellStyle).Text(timesheet.Quantity.ToString());

                                                    static IContainer CellStyle(IContainer container)
                                                    {
                                                        return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(2);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                });

                                // Add some spacing between project groups (optional)
                                column.Item().PaddingTop(20);
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
