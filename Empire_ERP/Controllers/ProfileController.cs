using Empire_ERP.Core.Entities;
using Empire_ERP.Core.Interfaces;
using Empire_ERP.Core.Services;
using Empire_ERP.Helpers;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mail;

namespace Empire_ERP.Controllers
{
    [CheckSession]
    public class ProfileController : BaseController
    {
        public ILoginService _loginService { get; set; }
        private readonly IWebHostEnvironment _hostingEnvironment;
        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private const long MaxImageSize = 2 * 1024 * 1024;

        public ProfileController(ILoginService loginService, IMenuService menuService, IWebHostEnvironment hostingEnvironment, IBaseService baseService) : base(menuService, baseService)
        {
            _loginService = loginService;
            _hostingEnvironment = hostingEnvironment;
        }

        [HttpGet]
        public JsonResult GetMyProfile()
        {
            try
            {
                int userId = CommonService.ParseInt(HttpContext.Session.GetString("Id"));
                var data = _loginService.GetProfile(userId);
                if (data.msgType == 1)
                {
                    var user = (User)data.data;
                    data.data = new
                    {
                        username = user.USERNAME,
                        fullName = user.FULLNAME,
                        cellNo = user.CELL_NO,
                        email = user.EMAIL,
                        picture = string.IsNullOrWhiteSpace(user.PICTURES) ? "" : $"/images/upload/users/{user.PICTURES}"
                    };
                }
                return Json(data);
            }
            catch (Exception ex)
            {
                string _catchMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    _catchMessage += "<br/>" + ex.InnerException.Message;
                }
                return Json(new MyHttpResponseMessage { msgType = 2, msg = _catchMessage });
            }
        }

        [HttpGet]
        public JsonResult SendEmailChangeOtp()
        {
            MyHttpResponseMessage response = new MyHttpResponseMessage();
            try
            {
                int userId = CommonService.ParseInt(HttpContext.Session.GetString("Id"));
                HttpContext.Session.Remove("ProfileEmailChangeVerified");

                var current = _loginService.GetProfile(userId);
                if (current.msgType != 1)
                {
                    return Json(current);
                }

                User user = (User)current.data;
                if (string.IsNullOrWhiteSpace(user.EMAIL))
                {
                    HttpContext.Session.SetString("ProfileEmailChangeVerified", "1");
                    return Json(new MyHttpResponseMessage
                    {
                        msgType = 1,
                        msg = "No email is saved. You can enter a new email now.",
                        data = new { skipOtp = true }
                    });
                }

                string templatePath = Path.Combine(_hostingEnvironment.WebRootPath, "Client", "NotificationTemplates", "ConfirmEmail.html");
                if (!System.IO.File.Exists(templatePath))
                {
                    return Json(new MyHttpResponseMessage { msgType = 2, msg = "Something went wrong while generating the OTP! please try again later." });
                }

                OTPUser expireOtp = new OTPUser { U_ID = user.U_ID, STATUS = "EXPIRED" };
                var expireResponse = _loginService.UpdateUserOTPStatus(expireOtp);
                if (expireResponse.msgType != 1)
                {
                    return Json(new MyHttpResponseMessage { msgType = 2, msg = "Something went wrong while generating the OTP! please try again later." });
                }

                OTPUser otpUser = new OTPUser
                {
                    U_ID = user.U_ID,
                    EMAIL = user.EMAIL,
                    OTP = new Random().Next(100000, 1000000)
                };
                var otpResponse = _loginService.SaveUserOTP(otpUser);
                if (otpResponse.msgType != 1)
                {
                    return Json(new MyHttpResponseMessage { msgType = 2, msg = "Something went wrong while generating the OTP! please try again later." });
                }

                MailMessage emailMessage = new MailMessage();
                emailMessage.To.Add(new MailAddress(user.EMAIL, user.FULLNAME));
                emailMessage.Subject = "Email Change Verification";
                emailMessage.Body = System.IO.File.ReadAllText(templatePath).Replace("[[OTP]]", Convert.ToString(otpUser.OTP));
                var emailResponse = CommonController.SendEmail(emailMessage);
                if (!emailResponse)
                {
                    return Json(new MyHttpResponseMessage { msgType = 2, msg = "Something went wrong while sending the email! please try again later." });
                }

                response.msgType = 1;
                response.msg = "Verification code sent.";
                response.data = new { skipOtp = false, email = CommonController.MaskEmail(user.EMAIL) };
            }
            catch (Exception ex)
            {
                string _catchMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    _catchMessage += "<br/>" + ex.InnerException.Message;
                }
                response.msgType = 2;
                response.msg = _catchMessage;
            }
            return Json(response);
        }

        [HttpGet]
        public JsonResult VerifyEmailChangeOtp(int? OTP)
        {
            MyHttpResponseMessage response = new MyHttpResponseMessage();
            try
            {
                int userId = CommonService.ParseInt(HttpContext.Session.GetString("Id"));
                if (OTP == null)
                {
                    return Json(new MyHttpResponseMessage { msgType = 2, msg = "Please enter the verification code." });
                }

                OTPUser otpUser = new OTPUser
                {
                    U_ID = userId,
                    OTP = OTP
                };
                response = _loginService.OTPVerification(otpUser);
                if (response.msgType == 1)
                {
                    HttpContext.Session.SetString("ProfileEmailChangeVerified", "1");
                }
            }
            catch (Exception ex)
            {
                response.msgType = 2;
                response.msg = "Something went wrong! please try again later.";
            }
            return Json(response);
        }

        [HttpPost]
        public async Task<JsonResult> SaveMyProfile(string USERNAME, string FULLNAME, string CELL_NO, string EMAIL, IFormFile? PICTURE)
        {
            MyHttpResponseMessage response = new MyHttpResponseMessage();
            try
            {
                int userId = CommonService.ParseInt(HttpContext.Session.GetString("Id"));
                FULLNAME = (FULLNAME ?? "").Trim();
                CELL_NO = (CELL_NO ?? "").Trim();
                EMAIL = (EMAIL ?? "").Trim();

                var current = _loginService.GetProfile(userId);
                if (current.msgType != 1)
                {
                    return Json(current);
                }
                User currentUser = (User)current.data;
                string USERNAME_DB = currentUser.USERNAME ?? "";
                string currentEmail = (currentUser.EMAIL ?? "").Trim();

                if (FULLNAME.Length > 50 || CELL_NO.Length > 20 || EMAIL.Length > 50)
                {
                    return Json(new MyHttpResponseMessage { msgType = 2, msg = "Full Name and Email allow max 50 characters, Mobile Number max 20." });
                }
                if (!string.IsNullOrWhiteSpace(EMAIL) && !MailAddress.TryCreate(EMAIL, out _))
                {
                    return Json(new MyHttpResponseMessage { msgType = 2, msg = "Please enter a valid email address." });
                }
                if (!string.Equals(EMAIL, currentEmail, StringComparison.OrdinalIgnoreCase)
                    && HttpContext.Session.GetString("ProfileEmailChangeVerified") != "1")
                {
                    return Json(new MyHttpResponseMessage { msgType = 2, msg = "Please verify the code sent to your email before changing it." });
                }

                string picture = currentUser.PICTURES;

                if (PICTURE != null && PICTURE.Length > 0)
                {
                    string extension = Path.GetExtension(PICTURE.FileName).ToLowerInvariant();
                    if (!AllowedImageExtensions.Contains(extension) || !PICTURE.ContentType.StartsWith("image/"))
                    {
                        return Json(new MyHttpResponseMessage { msgType = 2, msg = "Only JPG, PNG, GIF or WEBP images are allowed." });
                    }
                    if (PICTURE.Length > MaxImageSize)
                    {
                        return Json(new MyHttpResponseMessage { msgType = 2, msg = "Profile picture must be 2 MB or smaller." });
                    }

                    string uploadsFolder = Path.Combine(_hostingEnvironment.WebRootPath, "images", "upload", "users");
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }
                    picture = Guid.NewGuid().ToString().Substring(0, 25) + "_" + extension;
                    using (var fileStream = new FileStream(Path.Combine(uploadsFolder, picture), FileMode.Create))
                    {
                        await PICTURE.CopyToAsync(fileStream);
                    }
                }

                var model = new User
                {
                    U_ID = userId,
                    USERNAME = USERNAME_DB,
                    FULLNAME = FULLNAME,
                    CELL_NO = CELL_NO,
                    EMAIL = EMAIL,
                    PICTURES = picture
                };
                response = _loginService.UpdateProfile(model, CommonHelper.GetValues(HttpContext));
                if (response.msgType == 1)
                {
                    HttpContext.Session.Remove("ProfileEmailChangeVerified");
                    HttpContext.Session.SetString("Username", USERNAME_DB);
                    HttpContext.Session.SetString("Name", FULLNAME);
                    HttpContext.Session.SetString("Email", EMAIL);
                    HttpContext.Session.SetString("Picture", picture ?? "");
                    response.data = new
                    {
                        username = USERNAME_DB,
                        picture = string.IsNullOrWhiteSpace(picture) ? "" : $"/images/upload/users/{picture}"
                    };
                }
            }
            catch (Exception ex)
            {
                string _catchMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    _catchMessage += "<br/>" + ex.InnerException.Message;
                }
                response.msgType = 2;
                response.msg = _catchMessage;
            }
            return Json(response);
        }
    }
}
