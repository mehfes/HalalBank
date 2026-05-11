using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "Id", "CreatedDate", "Email", "FirstName", "LastName" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "john.doe@email.com", "John", "Doe" },
                    { 2, new DateTime(2026, 2, 20, 0, 0, 0, 0, DateTimeKind.Utc), "jane.smith@email.com", "Jane", "Smith" },
                    { 3, new DateTime(2026, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), "bob.wilson@email.com", "Bob", "Wilson" }
                });

            migrationBuilder.InsertData(
                table: "Subscriptions",
                columns: new[] { "Id", "BillingCycle", "Category", "CustomerId", "NextPaymentDate", "Price", "ProviderName", "Status" },
                values: new object[,]
                {
                    { 1, "Monthly", "Streaming", 1, new DateTime(2026, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), 15.99m, "Netflix", "Active" },
                    { 2, "Monthly", "Music", 1, new DateTime(2026, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), 9.99m, "Spotify", "Active" },
                    { 3, "Monthly", "Utilities", 2, new DateTime(2026, 5, 11, 0, 0, 0, 0, DateTimeKind.Utc), 120.00m, "Electricity Bill", "Active" },
                    { 4, "Monthly", "Utilities", 2, new DateTime(2026, 5, 11, 0, 0, 0, 0, DateTimeKind.Utc), 59.99m, "Internet", "Active" },
                    { 5, "Yearly", "Software", 3, new DateTime(2026, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), 99.99m, "Cloud Storage", "Active" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Subscriptions",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Subscriptions",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Subscriptions",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Subscriptions",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Subscriptions",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
