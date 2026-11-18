using Empire_ERP.Core.Entities;
using Empire_ERP.Core.Interfaces;
using Empire_ERP.Core.Services;
using Empire_ERP.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.ReportingServices.ReportProcessing.ReportObjectModel;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net.Mail;

namespace Empire_ERP.Controllers
{
    [ExtractMenuCode]
    [CheckSession]
    public class DatabaseBackupController : BaseController
    {
        public IDatabaseBackupService _databaseBackupService { get; set; }
        private readonly IWebHostEnvironment _hostingEnvironment;
        public ICompanyService _companyService { get; set; }
        public DatabaseBackupController(IMenuService menuService, IDatabaseBackupService databaseBackupService, IWebHostEnvironment hostingEnvironment, IBaseService baseService, ICompanyService companyService) : base(menuService, baseService)
        {
            _databaseBackupService = databaseBackupService;
            _hostingEnvironment = hostingEnvironment;
            _companyService = companyService;
        }

        public IActionResult Index()
        {
            ViewBag.Permissions = CommonHelper.GetValues(HttpContext).RoleType == "A"
                ? "Admin"
                : CommonHelper.GetPermissionByMenueID(CommonHelper.GetValues(HttpContext).RoleID, CommonHelper.GetValues(HttpContext).MenuID);
            return View();
        }

        [HttpGet]
        public JsonResult GetDBInformation()
        {
            try
            {
                var data = _databaseBackupService.GetDatabaseInformation();
                return Json(data);
            }
            catch (Exception ex)
            {
                string _catchMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    _catchMessage += "<br/>" + ex.InnerException.Message;
                }
                return Json(new { data = _catchMessage, msgType = 2 });
            }
        }

        [HttpGet]
        public JsonResult GenerateDBBackup()
        {
            try
            {
                var companydata = CommonHelper.GetValues(HttpContext);
                var currentCompanyResponse = _companyService.GetCompanyByCode(companydata.Company);
                var currentCompany = (Company)currentCompanyResponse.data;
                var data = _databaseBackupService.GenerateDatabaseBackup(_hostingEnvironment.WebRootPath, CommonHelper.GetValues(HttpContext));
                if (data.msgType != 1 || data.data == null)
                {
                    return Json(data);
                }

                var email = Convert.ToString(data.data2);
                var path = Convert.ToString(data.data);
                if (string.IsNullOrWhiteSpace(email))
                {
                    data.msgType = 2;
                    data.msg = "Backup created but no email is saved on your profile.";
                    return Json(data);
                }

                MailMessage emailMessage = new MailMessage();
                emailMessage.To.Add(new MailAddress(email));
                emailMessage.Subject = $@"Database Backup - {currentCompany.C_NAME}";
                emailMessage.Body = System.IO.File.ReadAllText(Path.Combine(_hostingEnvironment.WebRootPath, "Client", "NotificationTemplates", "DatabaseBackup.html"));
                Attachment attachment = new Attachment(Path.Combine(_hostingEnvironment.WebRootPath, "Client", "TempDatabaseBackupZips", path));
                emailMessage.Attachments.Add(attachment);
                var emailResponse = CommonController.SendEmail(emailMessage);
                if (!emailResponse)
                {
                    data.msgType = 2;
                    data.msg = "Backup created but email could not be sent. " + (CommonController.LastEmailError ?? "");
                    return Json(data);
                }

                data.msg = "Backup generated and sent to " + CommonController.MaskEmail(email) + ".";
                return Json(data);
            }
            catch (Exception ex)
            {
                string _catchMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    _catchMessage += "<br/>" + ex.InnerException.Message;
                }
                return Json(new { data = _catchMessage, msgType = 2 });
            }
        }
    }
}
