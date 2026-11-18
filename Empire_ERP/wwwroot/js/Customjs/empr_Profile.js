var empr_Profile = {
    defaultImage: '/images/img-user.jpg',
    maxImageSize: 2 * 1024 * 1024,
    selectedFile: null,
    originalEmail: '',
    emailUnlocked: false,

    themeKey: function () {
        return 'erpTheme_' + (window.erpUserId || '');
    },

    getTheme: function () {
        return localStorage.getItem(empr_Profile.themeKey()) === 'dark' ? 'dark' : 'light';
    },

    applyTheme: function (theme) {
        theme = theme === 'dark' ? 'dark' : 'light';
        localStorage.setItem(empr_Profile.themeKey(), theme);
        document.documentElement.setAttribute('data-theme', theme);
        $('#erpThemeSwitch').prop('checked', theme === 'dark');
        $('input[name="erpProfileTheme"][value="' + theme + '"]').prop('checked', true);
    },

    lockEmail: function () {
        empr_Profile.emailUnlocked = false;
        $('#erpProfileEmail').prop('readonly', true);
        $('#erpProfileEmailChange').show();
        $('#erpProfileOtpBox').hide();
        $('#erpProfileOtp').val('');
        $('#erpProfileOtpMsg').text('');
    },

    unlockEmail: function () {
        empr_Profile.emailUnlocked = true;
        $('#erpProfileEmail').prop('readonly', false).focus();
        $('#erpProfileEmailChange').hide();
        $('#erpProfileOtpBox').hide();
        $('#erpProfileOtp').val('');
    },

    sendEmailOtp: function () {
        var $change = $('#erpProfileEmailChange').prop('disabled', true);
        var $resend = $('#erpProfileOtpResend').prop('disabled', true);
        $("#Loader").show();
        $("#Loader").css('display', 'flex');
        $.ajax({
            url: '/Profile/SendEmailChangeOtp',
            type: 'GET',
            cache: false,
            success: function (data) {
                if (data.msgType !== 1) {
                    empr_helper.notify(data.msg || 'Unable to send verification code.', 2);
                    return;
                }
                if (data.data && data.data.skipOtp) {
                    empr_Profile.unlockEmail();
                    empr_helper.notify(data.msg, 1);
                    return;
                }
                $('#erpProfileOtpMsg').text("We've sent a verification code to " + (data.data.email || 'your email') + ".");
                $('#erpProfileOtpBox').show();
                $('#erpProfileOtp').val('').focus();
                empr_helper.notify(data.msg, 1);
            },
            error: function () {
                empr_helper.notify('Unable to send verification code.', 2);
            },
            complete: function () {
                $("#Loader").hide();
                $change.prop('disabled', false);
                $resend.prop('disabled', false);
            }
        });
    },

    verifyEmailOtp: function () {
        var otp = $.trim($('#erpProfileOtp').val());
        if (!/^\d{6}$/.test(otp)) {
            empr_helper.notify('Please enter the 6-digit verification code.', 2);
            $('#erpProfileOtp').focus();
            return;
        }
        var $btn = $('#erpProfileOtpVerify').prop('disabled', true);
        $.ajax({
            url: '/Profile/VerifyEmailChangeOtp',
            type: 'GET',
            data: { OTP: otp },
            cache: false,
            success: function (data) {
                empr_helper.notify(data.msg, data.msgType);
                if (data.msgType === 1) {
                    empr_Profile.unlockEmail();
                }
            },
            error: function () {
                empr_helper.notify('Unable to verify the code.', 2);
            },
            complete: function () {
                $btn.prop('disabled', false);
            }
        });
    },

    open: function () {
        empr_Profile.selectedFile = null;
        empr_Profile.originalEmail = '';
        $('#erpProfilePicture').val('');
        $('#erpProfileForm')[0].reset();
        empr_Profile.lockEmail();
        $('input[name="erpProfileTheme"][value="' + empr_Profile.getTheme() + '"]').prop('checked', true);

        $.ajax({
            url: '/Profile/GetMyProfile',
            type: 'GET',
            cache: false,
            success: function (data) {
                if (data.msgType !== 1 || !data.data) {
                    empr_helper.notify(data.msg || 'Unable to load profile.', 2);
                    return;
                }
                var p = data.data;
                empr_Profile.originalEmail = (p.email || '').trim();
                $('#erpProfileFullName').val(p.fullName || '');
                $('#erpProfileUsername').val(p.username || '');
                $('#erpProfileCell').val(p.cellNo || '');
                $('#erpProfileEmail').val(p.email || '');
                $('#erpProfilePreview').attr('src', p.picture || empr_Profile.defaultImage);
                $('#erpProfileTitle').text(p.fullName || p.username || 'My Profile');
                $('#erpProfileHandle').text(p.username ? '@' + p.username : '');
                empr_Profile.lockEmail();
                $('#erpProfileModal').modal('show');
            },
            error: function () {
                empr_helper.notify('Unable to load profile.', 2);
            }
        });
    },

    onPictureSelected: function (input) {
        var file = input.files && input.files[0];
        if (!file) {
            return;
        }
        if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
            empr_helper.notify('Only JPG, PNG, GIF or WEBP images are allowed.', 2);
            input.value = '';
            return;
        }
        if (file.size > empr_Profile.maxImageSize) {
            empr_helper.notify('Profile picture must be 2 MB or smaller.', 2);
            input.value = '';
            return;
        }
        empr_Profile.selectedFile = file;
        var reader = new FileReader();
        reader.onload = function (e) {
            $('#erpProfilePreview').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
    },

    save: function () {
        var username = $.trim($('#erpProfileUsername').val());
        var email = $.trim($('#erpProfileEmail').val());

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            empr_helper.notify('Please enter a valid email address.', 2);
            $('#erpProfileEmail').focus();
            return;
        }
        if (email.toLowerCase() !== (empr_Profile.originalEmail || '').toLowerCase() && !empr_Profile.emailUnlocked) {
            empr_helper.notify('Please verify the code sent to your email before changing it.', 2);
            return;
        }

        var formData = new FormData();
        formData.append('USERNAME', username);
        formData.append('FULLNAME', $.trim($('#erpProfileFullName').val()));
        formData.append('CELL_NO', $.trim($('#erpProfileCell').val()));
        formData.append('EMAIL', email);
        if (empr_Profile.selectedFile) {
            formData.append('PICTURE', empr_Profile.selectedFile);
        }

        var $btn = $('#erpProfileSave').prop('disabled', true);
        $.ajax({
            url: '/Profile/SaveMyProfile',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                empr_helper.notify(data.msg, data.msgType);
                if (data.msgType === 1) {
                    empr_Profile.applyTheme($('input[name="erpProfileTheme"]:checked').val());
                    if (data.data) {
                        $('#erpUserName').text(data.data.username);
                        $('#erpUserImg').attr('src', data.data.picture || empr_Profile.defaultImage);
                    }
                    $('#erpProfileModal').modal('hide');
                }
            },
            error: function () {
                empr_helper.notify('Unable to save profile.', 2);
            },
            complete: function () {
                $btn.prop('disabled', false);
            }
        });
    }
};

$(function () {
    $('#erpThemeSwitch').prop('checked', empr_Profile.getTheme() === 'dark');

    $('#erpUserBtn, #erpMenuProfile, #erpSideProfile, #erpDashSettings').on('click', function () {
        bootstrap.Dropdown.getOrCreateInstance($('.erp-settings-btn')[0]).hide();
        empr_Profile.open();
    });
    $('#erpThemeSwitch').on('change', function () {
        empr_Profile.applyTheme(this.checked ? 'dark' : 'light');
    });
    $('input[name="erpProfileTheme"]').on('change', function () {
        empr_Profile.applyTheme(this.value);
    });
    $('#erpProfilePicture').on('change', function () {
        empr_Profile.onPictureSelected(this);
    });
    $('#erpProfileEmailChange, #erpProfileOtpResend').on('click', function () {
        empr_Profile.sendEmailOtp();
    });
    $('#erpProfileOtpVerify').on('click', empr_Profile.verifyEmailOtp);
    $('#erpProfileOtp').on('input', function () {
        this.value = this.value.replace(/\D/g, '').substring(0, 6);
    }).on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            empr_Profile.verifyEmailOtp();
        }
    });
    $('#erpProfileSave').on('click', empr_Profile.save);
    $('#erpProfileForm').on('submit', function (e) {
        e.preventDefault();
        empr_Profile.save();
    });
});
