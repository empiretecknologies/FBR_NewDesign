using Empire_ERP.Core.Entities;
using Empire_ERP.Core.Interfaces;
using Empire_ERP.Core.Services;
using Empire_ERP.Helpers;
using Empire_ERP.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;
using System.Data;
using static Azure.Core.HttpHeader;

namespace Empire_ERP.Controllers
{
    public class BaseController : Controller
    {
        public IMenuService _menuService { get; set; }
        public IBaseService _baseService { get; set; }

        public BaseController(IMenuService menuService, IBaseService baseService)
        {
            _menuService = menuService;
            _baseService = baseService;
        }

        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var common = CommonHelper.GetValues(HttpContext);
            var host = Request.Host.Host.Split(".").FirstOrDefault();
            Controller controllerContext = (Controller)filterContext.Controller;
            bool isAjaxCall = filterContext.HttpContext.Request.Headers["x-requested-with"] == "XMLHttpRequest";
            if (!isAjaxCall)
            {
                ViewBag.Name = HttpContext.Session.GetString("Username");
                ViewBag.ProfileImage = $"/images/upload/users/{HttpContext.Session.GetString("Picture")}";

                string[] requestURL = filterContext.HttpContext.Request.Path.ToString().Split('/');
                string controllerURL = requestURL.Length > 1 ? requestURL[1] : "Home";
                if (string.IsNullOrWhiteSpace(controllerURL))
                {
                    controllerURL = "Home";
                }
                ViewBag.ControllerName = CommonService.UpperCaseWords(controllerURL);
                ViewBag.ControllerURL = controllerURL.ToLower();

                if (Request.Query.ContainsKey("Code"))
                {
                    int Code = CommonService.ParseInt(Request.Query["CODE"]);
                    ViewBag.Code = Code;
                    HttpContext.Session.SetString("MenuID", Code.ToString());
                }
                else
                {
                    int? resolvedId = NavHelper.ResolveMenuId(controllerURL);
                    if (resolvedId.HasValue)
                    {
                        HttpContext.Session.SetString("MenuID", resolvedId.Value.ToString());
                        ViewBag.Code = resolvedId.Value;
                    }
                }

                var navPage = NavHelper.GetByController(controllerURL);
                ViewBag.NavKey = navPage?.Key ?? "";
                ViewBag.PageGroup = navPage?.Group ?? ViewBag.ControllerName;
                ViewBag.MENU_NAME = navPage?.Title ?? ViewBag.ControllerName;
                ViewBag.WebsiteName = ViewBag.MENU_NAME;
                ViewBag.IsSidebarOpen = true;
                ViewBag.PageURL = ViewBag.WebsiteURL + controllerURL;

                string homeUrl = Url.Action("Index", "Home");
                string BreadCrumbHtml = $"<a href='{homeUrl}'><i class='fa fa-home'></i></a>";
                if (navPage != null && navPage.Controller != "Home")
                {
                    BreadCrumbHtml += $"<span class='sep'>›</span><span>{navPage.Group}</span><span class='sep'>›</span><strong>{navPage.Title}</strong>";
                }
                else
                {
                    BreadCrumbHtml += "<span class='sep'>›</span><strong>Dashboard</strong>";
                }
                BreadCrumbHtml += "<a href='javascript:;' class='ms-2' id='gearBtn'><i class='fa-solid fa-gear'></i></a>";
                ViewBag.BreadCrumbHTML = BreadCrumbHtml;
                ViewBag.Company = CommonHelper.GetCompanyName(common.Company);
                ViewBag.BranchForNav = CommonHelper.GetBranch(common.Branch);
                ViewBag.Period = CommonHelper.GetPeriod(common.Period);

                var common1 = CommonHelper.GetValues(HttpContext);
                //var Menu1 = _menuService.GetMenu(common.MenuID);
                //int? id = ;
                //if (Menu1.data != null)
                //{
                //    var menu = (Menu)Menu1.data;
                //    id = menu.ID,

                //}

                //var userName = HttpContext.Session.GetString("Username");
                //var mid = HttpContext.Session.GetString("MenuID");
                //var approval = _baseService.GetApproval(userName, common).GetAwaiter().GetResult();
                //ViewBag.StatusAppRR = approval;
                //var data11 = approval.data;

                //ViewBag.StatusApp = approval.data;
            }
            base.OnActionExecuting(filterContext);
        }
        public override void OnActionExecuted(ActionExecutedContext filterContext)
        {
            var userName = HttpContext.Session.GetString("Username");
            var common = CommonHelper.GetValues(HttpContext);
            var approval = _baseService.GetApproval(userName, common);
            ViewBag.StatusApp = approval.data;
            base.OnActionExecuted(filterContext);
        }
        public bool isSidebarOpens()
        {
            var user = CommonHelper.GetValues(HttpContext);
            string connectionString = new SQLService().getconnstring();
            DataTable dt = new DataTable();

            using (SqlConnection con = new SqlConnection(connectionString))
            {
                con.Open();

                string query = @"
                                    SELECT TOP 1 iS_SIDEBAR_OPEN 
                                    FROM TBL_FAVORITE_MENUS 
                                    WHERE USER_ID = @UserID 
                                    ORDER BY ADD_DATE DESC";

                using (SqlCommand cmd = new SqlCommand(query, con))
                {
                    cmd.Parameters.AddWithValue("@UserID", $"{user.UserID}");
                    SqlDataAdapter da = new SqlDataAdapter(cmd);
                    da.Fill(dt);
                }
            }

            bool isSidebarOpen = false;

            if (dt.Rows.Count > 0 && dt.Rows[0]["iS_SIDEBAR_OPEN"] != DBNull.Value)
            {
                isSidebarOpen = Convert.ToBoolean(dt.Rows[0]["iS_SIDEBAR_OPEN"]);
            }

            return isSidebarOpen;

        }
        [HttpPost]
        public JsonResult UpdateSettings(Base modelRecord)
        {
            try
            {
                var data = _baseService.UpdateSettings(modelRecord, CommonHelper.GetValues(HttpContext));
                return Json(data);
            }
            catch (Exception ex)
            {
                string _catchMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    _catchMessage += "<br/>" + ex.InnerException.Message;
                }
                return Json(_catchMessage);
            }
        }
        public JsonResult GetSettings()
        {
            var common = CommonHelper.GetValues(HttpContext);
            var Menu = _menuService.GetMenu(common.MenuID);
            string? search = string.Empty, rowlimit = string.Empty;
            int? DClear = 0;

            if (Menu.data != null)
            {
                var menu = (Menu)Menu.data;
                search = menu.SEARCH;
                rowlimit = menu.LIMIT;
                DClear = menu.DATA_CLEAR;

            }
            var data = new
            {
                SEARCH = search,
                ROW_LIMIT = rowlimit,
                DATA_CLEAR = DClear
            };
            return Json(data);

        }

    }
}