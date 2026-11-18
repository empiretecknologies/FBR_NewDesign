using Empire_ERP.Core.Services;
using Microsoft.Data.SqlClient;

namespace Empire_ERP.Helpers
{
    public class NavPageInfo
    {
        public string Key { get; set; } = "";
        public string Title { get; set; } = "";
        public string Group { get; set; } = "";
        public string Controller { get; set; } = "";
        public string NameHint { get; set; } = "";
        public string TableHint { get; set; } = "";
    }

    public static class NavHelper
    {
        public static readonly List<NavPageInfo> Pages = new()
        {
            new NavPageInfo { Key = "dashboard", Title = "Dashboard", Group = "Dashboard", Controller = "Home" },
            new NavPageInfo { Key = "purchase-bill", Title = "Sales Tax Invoice", Group = "Transactions", Controller = "PurchaseBill", NameHint = "Purchase" },
            new NavPageInfo { Key = "sales-tax-invoice-report", Title = "Sales Tax Invoice Report", Group = "Reports", Controller = "SalesInvoiceReport", NameHint = "Sales" },
            new NavPageInfo { Key = "customer", Title = "Customer", Group = "Setup", Controller = "PartyTypes", NameHint = "Customer" },
            new NavPageInfo { Key = "item-master", Title = "Item Master", Group = "Setup", Controller = "ItemMaster", NameHint = "Item" },
            new NavPageInfo { Key = "unit-of-measure", Title = "Unit of Measure", Group = "Setup", Controller = "SetupType", NameHint = "Unit", TableHint = "TBL_UNIT" },
            new NavPageInfo { Key = "user-management", Title = "User Management", Group = "Settings", Controller = "User", NameHint = "User", TableHint = "TBL_USER" },
            new NavPageInfo { Key = "database-backup", Title = "Database Backup", Group = "Settings", Controller = "DatabaseBackup", NameHint = "Backup" }
        };

        public static NavPageInfo? GetByController(string? controller)
        {
            if (string.IsNullOrWhiteSpace(controller))
            {
                return null;
            }

            return Pages.FirstOrDefault(x => x.Controller.Equals(controller, StringComparison.OrdinalIgnoreCase));
        }

        public static int? ResolveMenuId(string? controller)
        {
            var page = GetByController(controller);
            if (page == null || page.Controller.Equals("Home", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            try
            {
                using SqlConnection connection = new SqlConnection(new SQLService().getconnstring());
                connection.Open();

                int? id = LookupMenuId(connection, page.Controller, page.NameHint, page.TableHint);
                if (id == null && !string.IsNullOrWhiteSpace(page.NameHint))
                {
                    id = LookupMenuId(connection, page.Controller, null, page.TableHint);
                }
                if (id == null && !string.IsNullOrWhiteSpace(page.TableHint))
                {
                    id = LookupMenuId(connection, page.Controller, null, null);
                }

                return id;
            }
            catch
            {
                return null;
            }
        }

        private static int? LookupMenuId(SqlConnection connection, string controller, string? nameHint, string? tableHint)
        {
            string query = @"
                SELECT TOP 1 ID
                FROM TBL_MENU_BUILDER
                WHERE DLT = 'T'
                  AND ASTATUS = 'Y'
                  AND (
                        MENU_PAGE = @page
                        OR MENU_PAGE LIKE @pageLike
                        OR MENU_PAGE LIKE @pageEnd
                      )";

            if (!string.IsNullOrWhiteSpace(nameHint))
            {
                query += " AND MENU_NAME LIKE @nameHint";
            }
            if (!string.IsNullOrWhiteSpace(tableHint))
            {
                query += " AND TABLE1 = @tableHint";
            }

            query += " ORDER BY CASE WHEN MENU_TYPE = 3 THEN 0 ELSE 1 END, ID";

            using SqlCommand command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@page", controller);
            command.Parameters.AddWithValue("@pageLike", controller + "/%");
            command.Parameters.AddWithValue("@pageEnd", "%/" + controller);
            if (!string.IsNullOrWhiteSpace(nameHint))
            {
                command.Parameters.AddWithValue("@nameHint", "%" + nameHint + "%");
            }
            if (!string.IsNullOrWhiteSpace(tableHint))
            {
                command.Parameters.AddWithValue("@tableHint", tableHint);
            }

            object? result = command.ExecuteScalar();
            if (result == null || result == DBNull.Value)
            {
                return null;
            }

            return Convert.ToInt32(result);
        }
    }
}
