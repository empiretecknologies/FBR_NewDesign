var empr_LoginDetails = {
    InitEvents: function () {
        AllPeriods = [];
        $(document).ready(function () {
            empr_LoginDetails.LoadAllDDL();
            //empr_LoginDetails.InitCompaniesDDL();
            //empr_LoginDetails.InitBranchesDDL();
            //empr_LoginDetails.InitPeriodsDDL();

            $('#nextmove').click(function () {
                debugger;
                var company = $('#companydxddl').val();
                var branch = $('#branchdxddl').val();
                var period = $('#perioddxddl').val();
                var isvalid = true;
                if (company == '' || company == null || company == undefined) {
                    isvalid = false;
                    empr_helper.notify('Please select company.', 2);
                }
                if (branch == '' || branch == null || branch == undefined) {
                    isvalid = false;
                    empr_helper.notify('Please select branch.', 2);
                }
                if (period == '' || period == null || period == undefined) {
                    isvalid = false;
                    empr_helper.notify('Please select period.', 2);
                }

                if (!isvalid) {
                    return;
                }

                //if (window.location.protocol == 'https:') {
                //    if (navigator.geolocation) {
                //        navigator.geolocation.getCurrentPosition(empr_LoginDetails.ShowPosition, empr_LoginDetails.ShowError);
                //    } else {
                //        empr_helper.notify("Geolocation is not supported by this browser.", 2);
                //    }
                //}
                //else {

                //}
                var xhr = ajaxHelper.ajaxGetJson('/Login/SaveLoginUserDetails?company=' + company + "&branch=" + branch + "&period=" + period, function (data) {
                    debugger;
                    if (data.msgType == 1) {
                        empr_helper.notify(data.msg, 1);
                        window.location.href = "/Home";
                    }
                    else {
                        empr_helper.notify(data.msg, 2);
                    }
                }, false, true);
            });
        });
    },
    ShowPosition: function (position) {
        debugger;
        if (position != null || position != [] || position != undefined) {
            debugger;
            var company = $('#companydxddl').val();
            var branch = $('#branchdxddl').val();
            var period = $('#perioddxddl').val();
            var xhr = ajaxHelper.ajaxGetJson('/Login/SaveLoginUserDetails?company=' + company + "&branch=" + branch + "&period=" + period + "&lat=" + position.coords.latitude + "&lon=" + position.coords.longitude, function (data) {
                debugger;
                if (data.msgType == 1) {
                    empr_helper.notify(data.msg, 1);
                    window.location.href = "/Home";
                }
                else {
                    empr_helper.notify(data.msg, 2);
                }
            }, false, true);
        }
    },
    ShowError: function (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                empr_helper.notify("Please allow the location permission.", 2);
                break;
            case error.POSITION_UNAVAILABLE:
                empr_helper.notify("Please allow the location permission.", 2);
                break;
            case error.TIMEOUT:
                empr_helper.notify("Please allow the location permission.", 2);
                break;
            case error.UNKNOWN_ERROR:
                empr_helper.notify("Please allow the location permission.", 2);
                break;
        }
    },
    //InitCompaniesDDL: function (selectedValue) {
    //    $.ajax({
    //        url: '/Company/GetAllCompanies',
    //        method: 'GET',
    //        success: function (data) {
    //            $('#companydxddl').dxSelectBox({
    //                dataSource: data.data.table,
    //                displayExpr: 'c_NAME',
    //                valueExpr: 'ccode',
    //                value: selectedValue,
    //                searchEnabled: true,
    //                width: '100%',
    //                placeholder: 'Search',
    //                showClearButton: true,
    //                dropDownOptions: {
    //                    height: 'auto',
    //                },
    //                pagingEnabled: true,
    //                searchTimeout: 500,
    //                onValueChanged: function (e) {
    //                    empr_LoginDetails.InitBranchesDDL(e.value);
    //                },
    //                onInitialized: function (e) {
    //                    //if (data.data.table.length > 0) {
    //                    //    e.component.option('value', data.data.table[0].ccode);
    //                    //}
    //                }
    //            });
    //            setTimeout(function () {
    //                if (data.data.table.length > 0) {
    //                    $('#companydxddl').dxSelectBox('instance').option('value', data.data.table[0].ccode);
    //                }
    //            },100);
    //        },
    //        error: function (error) {
    //            console.error('Error fetching data:', error);
    //        }
    //    });
    //},
    //InitBranchesDDL: function (companyID, selectedValue) {
    //    $.ajax({
    //        url: '/Branch/GetBranchesByCompany?id=' + companyID,
    //        method: 'GET',
    //        success: function (data) {
    //            $('#branchdxddl').dxSelectBox({
    //                dataSource: data.data,
    //                displayExpr: 'b_NAME',
    //                valueExpr: 'bcode',
    //                value: selectedValue,
    //                searchEnabled: true,
    //                width: '100%',
    //                placeholder: 'Search',
    //                showClearButton: true,
    //                dropDownOptions: {
    //                    height: 'auto',
    //                },
    //                pagingEnabled: true,
    //                searchTimeout: 500,
    //                onValueChanged: function (e) {
    //                    empr_LoginDetails.InitPeriodsDDL(e.value);
    //                },
    //                onInitialized: function (e) {
    //                    //if (data.data.table.length > 0) {
    //                    //    e.component.option('value', data.data.table[0].bcode);
    //                    //}
    //                }
    //            });

    //            setTimeout(function () {
    //                if (data.data.length > 0) {
    //                    $('#branchdxddl').dxSelectBox('instance').option('value', data.data[0].bcode);
    //                }
    //            }, 100);
    //        },
    //        error: function (error) {
    //            console.error('Error fetching data:', error);
    //        }
    //    });
    //},
    //InitPeriodsDDL: function (branchID, selectedValue) {
    //    $.ajax({
    //        url: '/Period/GetPeriodsByBranch?branchid=' + branchID,
    //        method: 'GET',
    //        success: function (data) {
    //            $('#perioddxddl').dxSelectBox({
    //                dataSource: data.data,
    //                displayExpr: 'descr',
    //                valueExpr: 'pid',
    //                value: selectedValue,
    //                searchEnabled: true,
    //                width: '100%',
    //                placeholder: 'Search',
    //                showClearButton: true,
    //                dropDownOptions: {
    //                    height: 'auto',
    //                },
    //                pagingEnabled: true,
    //                searchTimeout: 500,
    //                onInitialized: function (e) {
    //                    //if (data.data.table.length > 0) {
    //                    //    e.component.option('value', data.data.table[0].pid);
    //                    //}
    //                }
    //            });

    //            setTimeout(function () {
    //                if (data.data.length > 0) {
    //                    $('#perioddxddl').dxSelectBox('instance').option('value', data.data[0].pid);
    //                }
    //            }, 100);
    //        },
    //        error: function (error) {
    //            console.error('Error fetching data:', error);
    //        }
    //    });
    //},
    FillSelect: function ($el, items, valueKey, textKey, selectedValue) {
        $el.empty();
        $el.append($('<option></option>').val('').text('Select'));
        (items || []).forEach(function (item) {
            $el.append($('<option></option>').val(item[valueKey]).text(item[textKey]));
        });
        if (selectedValue !== undefined && selectedValue !== null && selectedValue !== '') {
            $el.val(String(selectedValue));
        }
    },
    BindPeriodsByBranch: function (branchId) {
        var periods = (empr_LoginDetails.AllPeriods || []).filter(function (x) {
            return String(x.bcode) === String(branchId);
        });
        var selected = periods.length > 0 ? periods[0].pid : '';
        empr_LoginDetails.FillSelect($('#perioddxddl'), periods, 'pid', 'descr', selected);
    },
    LoadAllDDL: function () {
        $.ajax({
            url: '/Login/GetAllDDL',
            method: 'GET',
            success: function (data) {
                empr_LoginDetails.AllPeriods = data.data.allPeriods || [];
                empr_LoginDetails.FillSelect($('#companydxddl'), data.data.companies, 'ccode', 'c_NAME');
                empr_LoginDetails.FillSelect($('#branchdxddl'), data.data.branches, 'bcode', 'b_NAME');
                empr_LoginDetails.FillSelect($('#perioddxddl'), data.data.periods, 'pid', 'descr');

                $('#branchdxddl').off('change.loginPeriod').on('change.loginPeriod', function () {
                    empr_LoginDetails.BindPeriodsByBranch($(this).val());
                });

                if (data.data.companies && data.data.companies.length > 0) {
                    $('#companydxddl').val(String(data.data.companies[0].ccode));
                }
                if (data.data.branches && data.data.branches.length > 0) {
                    $('#branchdxddl').val(String(data.data.branches[0].bcode));
                    empr_LoginDetails.BindPeriodsByBranch(data.data.branches[0].bcode);
                } else if (data.data.periods && data.data.periods.length > 0) {
                    $('#perioddxddl').val(String(data.data.periods[0].pid));
                }
            },
            error: function (error) {
                console.error('Error fetching data:', error);
            }
        });
    }
}