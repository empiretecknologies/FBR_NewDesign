$(document).keydown(function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if ($("#Code").val() != '') {
            empr_PurchaseBill.Delete();
        } else {
            empr_helper.notify("Please select any record for delete..", 2);
        }
        return false;
    }
    if ((e.altKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        $("#SCODE").dxSelectBox("instance")?.option("value", "");

        empr_PurchaseBill.ResetForm();
        return false;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        $('.card .modal').modal('show');
        return false;
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        return false;
    }
});

var empr_PurchaseBill = {
    totalCount: 0,
    formName: typeForm,
    rowsCount: 0,
    pickIds: [],
    vDate: '',
    CurrentStock: [],
    originalValues: {},
    alreadySaved: [],
    // BtnSodaPick
    // BtnAddSodaToDelivery
    InitEvents: function () {
        $(document).ready(function () {
            console.log('Items', Items);

            empr_PurchaseBill.GetCurrentStock();
            empr_PurchaseBill.InitQuickSearchGrid();
            empr_PurchaseBill.ResetForm();
            empr_PurchaseBill.InitReportTypeDDL();


            window.addEventListener('message', function (event) {

                if (event.origin !== window.location.origin) {
                    return;
                }
                var data = event.data;
                if (data && data.traN_ID) {
                    empr_helper.selectedBill = data.traN_ID;
                    $('#Code').val(data.traN_ID);
                    empr_PurchaseBill.GetPurchaseBillByCode(data.traN_ID);
                }
            });

            $('body').on('click', '.elm_print', function () {
                empr_helper.selectedBill = $(this).attr("reportid");
                empr_PurchaseBill.GeneratePrintReport();
            });

            //$('.chkCell').prop('checked', true);

            $('body').on('click', '.elm_edit', function () {
                var id = $(this).attr("reportid");
                $('#Code').val(id);
                $('.modal').modal('hide');
                empr_helper.selectedBill = id;
                empr_PurchaseBill.GetPurchaseBillByCode(id, true);
            });

            $('body').on('click', '#ivBtnCancel', function () {
                $('#BtnNew').click();
            });

            $('body').on('click', '#ivBtnDelete', function () {
                empr_PurchaseBill.Delete();
            });

            $('body').on('click', '#ivBtnEdit', function () {
                empr_PurchaseBill.HideInvoiceView();
                $('#DetailContainer').dxDataGrid('instance').resize();
            });

            $('body').on('click', '#ivBtnSave', function () {
                $('#BtnSave').click();
            });

            $('body').on('click', '#ivBtnViewQr', function () {
                $('#ivQrModalImg').attr('src', $('#ivQrImg').attr('src'));
                $('#ivQrModal').modal('show');
            });

            $('body').on('click', '#BtnFbrResView', function () {
                empr_PurchaseBill.ShowFbrResponse();
            });

            $('body').on('click', '#ivBtnExportPdf', function () {
                empr_PurchaseBill.ExportInvoicePdf();
            });

            $('body').on('click', '#BtnfBRpOST', function () {
                var code = $('#Code').val();
                if (code == null || code == 0) {
                    empr_helper.notify('Create Entry first', 2);
                } else {
                    $("#Loader").show();
                    $("#Loader").css('display', 'flex');
                    empr_PurchaseBill.GetAndPostDataToApi(code);
                }
            });

            $('body').on('click', '.elm_copy', function () {
                var id = $(this).attr("reportid");
                var date = $(this).attr("reportdate");
                swal({
                    title: 'Are you sure you want to Copy this record?',
                    text: "",
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#0CC27E',
                    cancelButtonColor: '#FF586B',
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                    confirmButtonClass: 'btn btn-success mr-5',
                    cancelButtonClass: 'btn btn-danger',
                    buttonsStyling: false
                }).then(function () {
                    $('#updatedDate').val(date);
                    empr_helper.selectedBill = id;
                    $('#CopyViewModal').modal('show');
                });
            });

            $('body').on('click', '#docBrowseBtn', function () {
                $('#DOC').val('');
                $('#hdnDOC').val('');
                $('#DOCName').val('');
                $('#DOC').click();
            });

            $('body').on('click', '#saveCopiedRecord', function () {
                ajaxHelper.ajaxPostJsonData({ traN_ID: empr_helper.selectedBill, v_DATE: $('#updatedDate').val() }, "/PurchaseBill/CopyRecord", function (data) {
                    empr_helper.notify(data.msg, data.msgType);
                    if (data.msgType == 1) {
                        $('.modal').modal('hide');
                        empr_PurchaseBill.GetPurchaseBillByCode(data.data.code);
                    }
                }, false, true);
            });

            $('body').on('click', '#BtnSave', function () {
                if (Permissions != "Admin") {
                    if (!$("#Code").val() && !Permissions.r_ADD) {
                        empr_helper.notify("You are not allowed to add new record !", 2);
                    }
                    else if (($("#Code").val() > 0) && !Permissions.r_EDIT) {
                        empr_helper.notify("You are not allowed to edit records !", 2);
                    } else {
                        $("#Loader").show();
                        $("#Loader").css('display', 'flex');
                        setTimeout(function () {
                            if (empr_PurchaseBill.ValidateMainInfo()) {
                                empr_PurchaseBill.Save();
                            }
                            setTimeout(function () {
                                $("#Loader").hide();
                            }, 500);
                        }, 200);
                    }
                } else {
                    $("#Loader").show();
                    $("#Loader").css('display', 'flex');
                    setTimeout(function () {
                        if (empr_PurchaseBill.ValidateMainInfo()) {
                            empr_PurchaseBill.Save();
                        }
                        setTimeout(function () {
                            $("#Loader").hide();
                        }, 500);
                    }, 200);
                }
            });

            $('body').on('click', '#BtnDelete', function () {
                empr_PurchaseBill.Delete();
            });

            $('body').on('click', '#BtnNew', function () {
                $("#SCODE").dxSelectBox("instance")?.option("value", "");
                empr_PurchaseBill.ResetForm();
            });

            $('body').on('click', '#BtnQuickSearch', function () {
                empr_PurchaseBill.InitQuickSearchGrid();
            });

            $('body').on('click', '#BtnPrint,#BtnGenerateReport', function () {
                empr_PurchaseBill.GeneratePrintReport();
            });

            //$('body').on('click', '#BtnSodaPick', function () {
            //    empr_PurchaseBill.InitSodaPickGrid();
            //});

            $('body').on('click', '#BtnAddSodaToDelivery', function () {
                var selectedSodas = $('#SodaPickGridContainer').dxDataGrid('instance').getSelectedRowKeys();
                if (selectedSodas.length > 0) {
                    empr_PurchaseBill.AddToDelivery();
                    $('#BtnSave').show();

                }
                else {
                    empr_helper.notify("Please select record first.", 2);
                }
            });

            $('body').on('click', '#BtnChargesSave', function () {

                empr_PurchaseBill.GetAndSaveCharges();
            });

            if (Permissions != "Admin") {
                !Permissions.r_ADD && $('#BtnNew').hide();
                !Permissions.r_VIEW && $('#BtnQuickSearch').hide();
                !Permissions.r_PRINT && $('.btn-print').hide();
                (!Permissions.r_ADD && !Permissions.r_EDIT) && $('#BtnSave').hide();
            }
        });
    },

    GetAndSaveCharges: function () {
        debugger;

        var checkSignValidation = function (gridData) {
            debugger;
            if (!gridData || gridData.length === 0) return true;

            for (var i = 0; i < gridData.length; i++) {
                var row = gridData[i];
                if (row.chargeS_CODE === undefined || row.chargeS_CODE === null || String(row.chargeS_CODE).trim() === '') {
                    var lineNo = i + 1;
                    empr_helper.notify('Charges Account is required on line ' + lineNo, 2);
                    return false;
                }

                if (row.sign === undefined || row.sign === null || String(row.sign).trim() === '') {
                    var lineNo = i + 1;
                    empr_helper.notify('Sign is required on line ' + lineNo, 2);
                    return false;
                }
            }
            return true;
        };

        if ($('#ChargesGridContainer').dxDataGrid('instance').hasEditData()) {
            $('#ChargesGridContainer').dxDataGrid('instance').saveEditData().done(function () {
                debugger;
                var data = $('#ChargesGridContainer').dxDataGrid('instance').option("dataSource");

                if (!checkSignValidation(data)) {
                    return;
                }

                var result = empr_PurchaseBill.ValidateMainInfo(data);
                if (result) {
                    var id = $('#Code').val();
                    var dataModel = {
                        TRAN_ID: id,
                        Charges: data,
                    };
                    empr_PurchaseBill.SaveChargesData(dataModel);
                }
            });
        }
        else {
            debugger;
            var data = $('#ChargesGridContainer').dxDataGrid('instance').option("dataSource");

            if (!checkSignValidation(data)) {
                return;
            }

            var id = $('#Code').val();
            var dataModel = {
                TRAN_ID: id,
                Charges: data,
            };
            empr_PurchaseBill.SaveChargesData(dataModel);
        }
    },

    SaveChargesData: function (dataModel) {

        console.log('SaveChargesData', dataModel);
        ajaxHelper.ajaxPostJsonData(dataModel, "/PurchaseBill/SaveCharges", function (data) {
            console.log('charges save', data);
            empr_helper.notify(data.msg, data.msgType);
            if (data.msgType == 1) {
                empr_PurchaseBill.GetChargesByCode();
            }
        }, false, true);
    },

    GetChargesByCode: function () {
        var code = $('#Code').val();
        ajaxHelper.ajaxGetJson('/PurchaseBill/GetChargesByCode?code=' + code, function (data) {
            console.log('charges save res : ', data);
            if (data.charges.msgType == 1) {

                debugger;
                if (data.charges.data.length > 0) {

                    empr_PurchaseBill.CreateChargesGrid(data.charges.data, false);
                }
                else {
                    empr_PurchaseBill.CreateChargesGrid(data.defaultCharges);
                }

            }
            else {
                empr_helper.notify(data.master.msg, data.master.msgType);
            }
        }, false, true);
    },

    InitSodaPickGrid: function () {
        var PARTY_CODE = $("#partyhidden").val();
        var ACT_CODE = $("#acthidden").val();
        console.log(PARTY_CODE);
        empr_PurchaseBill.GetPickDataByParty(PARTY_CODE, ACT_CODE);

        //if (PARTY_CODE == "" || PARTY_CODE == null || PARTY_CODE == undefined || PARTY_CODE == 0) {
        //    empr_helper.notify("Please select party first.", 2);
        //}
        //else {
        //    empr_PurchaseBill.GetPickDataByParty(PARTY_CODE, ACT_CODE);
        //}
    },

    GetPickDataByParty: function (PARTY_CODE, ACT_CODE) {
        ajaxHelper.ajaxGetJson('/PurchaseBill/GetPickDataByParty?partyCode=' + PARTY_CODE + '&actCode=' + ACT_CODE, function (data) {
            console.log(data)
            if (data.msgType == 1) {
                if (data.data.length > 0) {
                    if ($('#SodaPickGridContainer').data('dxDataGrid') != undefined) {
                        $('#SodaPickGridContainer').data('dxDataGrid').dispose();
                    }
                    empr_PurchaseBill.CreatePickGrid(data.data);
                    $('#SodaPickModal').modal('show');
                } else {
                    empr_helper.notify("No soda found.", 2);
                }
            }
            else {
                empr_helper.notify(data.msg, data.msgType);
            }
        }, false, true);
    },

    CreatePickGrid: function (dataSrc) {
        var grid = $('#DetailContainer').dxDataGrid('instance');
        grid.saveEditData();
        existingdata = grid.option('dataSource');
        debugger;
        updatedData = dataSrc
            .map(item => {
                debugger;
                const matchingRows = existingdata.filter(row => row.picK_ID_D === item.picK_ID_D && (row.dT_CODE == null || row.dT_CODE == 0));
                const totalPack = matchingRows.reduce((sum, row) => parseInt(sum) + parseInt(row.qty), 0);
                item.totaL_PACK -= totalPack;
                item.rqty += totalPack;

                const totalQty = matchingRows.reduce((sum, row) => parseInt(sum) + parseInt(row.qty), 0);
                item.qty -= totalQty;

                var Amount = item.totaL_PACK * item.rate;
                item.amt = Amount;

                var Dis = parseFloat(item.disc) || 0;
                var disSum = Amount * Dis / 100 || 0;
                var Adv = parseFloat(item.adv) || 0;
                var Tax = parseFloat(item.tax) || 0;
                var TaxAmount = Amount - disSum || 0;

                var TaxSum = TaxAmount * Tax / 100 || 0;
                var AdvSum = (TaxAmount + TaxSum) * Adv / 100 || 0;

                item.disC_AMT = disSum.toFixed(2);
                item.taX_AMT = TaxSum.toFixed(2);
                item.adV_AMT = AdvSum.toFixed(2);

                if (!isNaN(Amount) && !isNaN(TaxSum) && !isNaN(AdvSum)) {
                    item.neT_AMT = (Amount + TaxSum + AdvSum).toFixed(2);
                } else {
                    item.neT_AMT = 0;
                }

                return item;
            })
            .filter(item => item !== null);
        empr_PurchaseBill.originalValues = {};
        updatedData.forEach(row => {
            empr_PurchaseBill.originalValues[row.picK_ID_D] = row.totaL_PACK;
        });

        col = [
            { dataField: 'lB_DATE', caption: 'Date', visible: true, allowEditing: false, },
            {
                dataField: 'voucheR_NO', caption: 'Transaction #', width: 230, visible: true, allowEditing: false,
                cellTemplate: function (container, options) {
                    $('<a>')
                        .addClass('dx-link')
                        .text(options.value)
                        .attr('href', '#')
                        .attr('onclick', 'empr_PurchaseBill.openVoucherPage(' + JSON.stringify(options.data.link) + ', ' + JSON.stringify(options.data.id) + ')')
                        .appendTo(container);
                }
            },
            { dataField: 'partY_NAME', caption: 'Party Name', visible: true, width: 150, allowEditing: false, fixed: false },
            //{ dataField: 'ref', caption: 'Ref', visible: true, allowEditing: false, fixed: false },
            { dataField: 'warehousE_NAME', caption: 'Warehouse', visible: true, allowEditing: false, fixed: false },
            { dataField: 'loT_NAME', caption: 'Lot', visible: true, allowEditing: false, fixed: false },
            { dataField: 'iteM_NAME', caption: 'Item', visible: true, width: 200, allowEditing: false, fixed: false },
            { dataField: 'iqty', caption: 'Order Qty', dataType: 'number', width: 90, allowEditing: false, },
            { dataField: 'qty', caption: 'qty', dataType: 'number', width: 90, allowEditing: false, visible: false },
            { dataField: 'rqty', caption: 'Del Qty', dataType: 'number', width: 90, allowEditing: false, },
            {
                dataField: 'totaL_PACK',
                caption: 'Bal Qty',
                allowSorting: false,
                allowFiltering: false,
                allowEditing: false,
                dataType: 'number',
                width: 90,
                setCellValue: function (newData, value, currentRowData) {
                    const originalQty = empr_PurchaseBill.originalValues[currentRowData.picK_ID_D];
                    if (value <= originalQty) {
                        newData.totaL_PACK = value;
                    } else {
                        newData.totaL_PACK = originalQty;
                    }
                    var rate = parseFloat(currentRowData.rate) || 0;
                    var totaL_PACK = parseFloat(newData.totaL_PACK) || 0;
                    var qtY2 = parseFloat(currentRowData.qtY2) || 0;
                    if (isNaN(totaL_PACK)) {
                        empr_helper.notify("Please enter the correct quantity.", 2);
                    }
                    if (isNaN(qtY2)) {
                        empr_helper.notify("Please enter the correct quantity2.", 2);
                    }
                    if (!isNaN(totaL_PACK) && !isNaN(qtY2)) {

                        if (currentRowData.chK1) {
                            newData.baL_QTY = totaL_PACK + qtY2;
                        }
                        else {
                            newData.baL_QTY = totaL_PACK;
                        }
                        if (!isNaN(rate)) {
                            newData.amt = (newData.baL_QTY * rate).toFixed(2);

                            var Amount = newData.amt;
                            var Dis = parseFloat(currentRowData.disc) || 0;
                            var disSum = Amount * Dis / 100 || 0;
                            var Adv = parseFloat(currentRowData.adv) || 0;
                            var Tax = parseFloat(currentRowData.tax) || 0;
                            var DiscountAmount = disSum;
                            var TaxAmount = Amount - DiscountAmount || 0;

                            var TaxSum = TaxAmount * Tax / 100 || 0;
                            var AdvSum = (TaxAmount + TaxSum) * Adv / 100 || 0;

                            newData.disC_AMT = disSum.toFixed(2);
                            newData.taX_AMT = TaxSum.toFixed(2);
                            newData.adV_AMT = AdvSum.toFixed(2);

                            var NetAmount = Amount - DiscountAmount || 0;
                            if (!isNaN(NetAmount) && !isNaN(TaxSum) && !isNaN(AdvSum)) {
                                newData.neT_AMT = (NetAmount + TaxSum + AdvSum).toFixed(2);
                            } else {
                                newData.neT_AMT = 0;
                            }
                        }
                    }
                },
            },
            { dataField: 'uniT_NAME', caption: 'Unit', visible: true, allowEditing: false, },
            { dataField: 'rate', caption: 'Rate', dataType: 'number', width: 90, allowEditing: false, },
            { dataField: 'amt', caption: 'Amt', visible: true, allowEditing: false, dataType: 'number', format: "#,##0.##", },
            //{ dataField: 'coloR_NAME', caption: 'Color', visible: true, allowEditing: false, },
            //{ dataField: 'sizE_NAME', caption: 'Size', visible: true, allowEditing: false, },
            { dataField: 'dT_CODE', caption: 'Net Amt', visible: false, allowEditing: false, },
            { dataField: 'partY_CODE', caption: 'Party Code', visible: false, allowEditing: false, },
            { dataField: 'partY_DDL', visible: false, allowEditing: false, },
            { dataField: 'iteM_CODE', visible: false, allowEditing: false, },
            { dataField: 'comm', visible: false, allowEditing: false, },
            { dataField: 'comM_AMT', visible: false, allowEditing: false, },
            { dataField: 'bill_COMPANY', visible: false, allowEditing: false, },
        ];

        empr_helper.editableDxGridbindingForTransactionsVouchers('#SodaPickGridContainer', col, dataSrc, "PurchaseBillPick", "v_DATE", 'multiple');
        setTimeout(function () {
            $('#SodaPickGridContainer').dxDataGrid('instance').resize();
        }, 500);
    },

    AddToDelivery: function () {
        debugger;
        if ($('#SodaPickGridContainer').dxDataGrid('instance').hasEditData()) {
            $('#SodaPickGridContainer').dxDataGrid('instance').saveEditData().done(function () {
                var data = empr_PurchaseBill.GetDataToSave();
                var IsDataAvailableInGrid = false;
                var dropDownValueToSet = null;
                $.each(data.Detail, function (index, item) {
                    if (item.iteM_CODE != "" && item.iteM_CODE != null && item.iteM_CODE != undefined) {
                        IsDataAvailableInGrid = true;
                    }
                    if (!dropDownValueToSet && item.bilL_COMPANY) {
                        dropDownValueToSet = item.bilL_COMPANY;
                    }
                });

                if (IsDataAvailableInGrid) {
                    var existingData = $('#DetailContainer').dxDataGrid('instance').option('dataSource');
                    var selectedSodas = $('#SodaPickGridContainer').dxDataGrid('instance').getSelectedRowKeys();
                    var finalData = existingData.concat(selectedSodas);
                    debugger;
                    $('#DetailContainer').dxDataGrid('instance').option('dataSource', finalData);
                }
                else {
                    var selectedSodas = $('#SodaPickGridContainer').dxDataGrid('instance').getSelectedRowKeys();
                    $('#DetailContainer').dxDataGrid('instance').option('dataSource', selectedSodas);
                    dropDownValueToSet = selectedSodas[0].bilL_COMPANY;
                }

                var billCompany = $('#BILL_COMPANY').dxSelectBox('instance');
                if (billCompany) {
                    billCompany.option('value', dropDownValueToSet);
                    billCompany.option('disabled', true);
                }
                //$('.modal').hide();
                $('#SodaPickModal').modal('hide');
                $('#V_DATE').focus();
            });
        }
        else {
            var data = empr_PurchaseBill.GetDataToSave();
            debugger;
            var IsDataAvailableInGrid = false;
            var dropDownValueToSet = null;

            $.each(data.Detail, function (index, item) {
                if (item.iteM_CODE != "" && item.iteM_CODE != null && item.iteM_CODE != undefined) {
                    IsDataAvailableInGrid = true;
                }
                debugger;


            });
            debugger;

            if (IsDataAvailableInGrid) {
                var existingData = $('#DetailContainer').dxDataGrid('instance').option('dataSource');
                var selectedSodas = $('#SodaPickGridContainer').dxDataGrid('instance').getSelectedRowKeys();
                var finalData = existingData.concat(selectedSodas);
                debugger;
                dropDownValueToSet = selectedSodas[0].bilL_COMPANY;

                $('#DetailContainer').dxDataGrid('instance').option('dataSource', finalData);
            }
            else {
                debugger;
                var selectedSodas = $('#SodaPickGridContainer').dxDataGrid('instance').getSelectedRowKeys();

                var filteredData = $.grep(PartyType, function (item) {
                    return item.partyCode === selectedSodas[0].partY_CODE && item.accountCode === selectedSodas[0].acT_CODE;
                });
                $('#PARTY_CODE').dxSelectBox('instance').option('value', filteredData[0].key);
                $('#BTYPE').dxSelectBox('instance').option('value', selectedSodas[0].btype);
                $('#REMARKS').val(selectedSodas[0].remarks);
                $('#ORDER_TYPE').val(selectedSodas[0].ordeR_TYPE);
                $('#REF').val(selectedSodas[0].ref);

                $('#hdnDOC').val(selectedSodas[0].doc);
                var DocPath = selectedSodas[0].doc;
                var DocName = DocPath.split('/').pop();
                $("#DOCName").val(DocName);

                //dropDownValueToSet = selectedSodas[0].bilL_COMPANY;
                var updatedData = selectedSodas.map(item => {
                    var stockRecord = empr_PurchaseBill.CurrentStock.find(s => s.itemId == item.iteM_CODE);
                    return {
                        ...item,
                        currentStock: stockRecord ? stockRecord.balance : 0
                    };
                });

                $('#DetailContainer').dxDataGrid('instance').option('dataSource', updatedData);


                //$('#DetailContainer').dxDataGrid('instance').option('dataSource', selectedSodas);
            }

            var billCompany = $('#BILL_COMPANY').dxSelectBox('instance');
            if (billCompany) {
                billCompany.option('value', dropDownValueToSet);
                billCompany.option('disabled', true);
            }
            //$('.modal').hide();
            $('#SodaPickModal').modal('hide');
            $('#V_DATE').focus();
        }
    },

    GetCurrentStock: function () {
        ajaxHelper.ajaxGetJson('/PurchaseBill/GetCurrentStock', function (data) {
            if (data.length > 0) {
                empr_PurchaseBill.CurrentStock = data;
            }
            else {
                empr_helper.notify(data.msg, data.msgType);
            }
        }, false, true);
    },

    CalculateDetailAmounts: function (qty, rate, tax, furtherTax) {
        var q = parseFloat(qty) || 0;
        var r = parseFloat(rate) || 0;
        var t = parseFloat(tax) || 0;
        var ft = parseFloat(furtherTax) || 0;
        var amt = q * r;
        var taxAmt = amt * t / 100;
        var furtherTaxAmt = amt * ft / 100;
        var netAmt = amt + taxAmt + furtherTaxAmt;
        return {
            amt: amt.toFixed(2),
            taX_AMT: taxAmt.toFixed(2),
            f_TAX_AMT: furtherTaxAmt.toFixed(2),
            neT_AMT: netAmt.toFixed(2)
        };
    },

    GetFBRScenarioTax: function (scenarioId) {
        switch (scenarioId) {
            case "SN001":
            case "SN002":
            case "SN003":
            case "SN004":
            case "SN008":
            case "SN009":
            case "SN011":
            case "SN014":
            case "SN015":
                return 18;
            case "SN005":
                return 1;
            case "SN006":
            case "SN007":
                return 0;
            case "SN010":
                return 17;
            case "SN012":
                return 1.43;
            case "SN013":
            case "SN016":
                return 5;
            case "SN017":
                return 8;
            case "SN024":
                return 25;
            default:
                return 0;
        }
    },

    CreateGrid: function (dataSrc) {

        var col = [
            {
                dataField: "Action",
                width: 120,
                alignment: 'center',
                fixed: true,
                fixedPosition: "left",
                allowExporting: false,
                allowEditing: false,
                cellTemplate: function (container, options) {
                    if (Permissions != "Admin") {
                        const copyAction = !Permissions.r_COPY
                            ? ''
                            : `<a href="javascript:;" class="grid-action-icon Clone" onclick="empr_PurchaseBill.CloneRow(${options.rowIndex})" title="Duplicate"><i class="fa fa-clone"></i></a>`;
                        const addAction = (!Permissions.r_ADD && !Permissions.r_EDIT)
                            ? ''
                            : `<a href="javascript:;" class="grid-action-icon Add" style="margin-left: 8px" onclick="empr_PurchaseBill.AddRow()" title="Add"><i class="fa fa-add"></i></a>`;
                        const deleteAction = !Permissions.r_DLT
                            ? ''
                            : `<a href="javascript:;" class="grid-action-icon Delete" style="margin-left: 8px" onclick="empr_PurchaseBill.DeleteRow(${options.rowIndex},${options.data.dT_CODE})" title="Delete"><i class="fa fa-trash"></i></a>`;
                        const searchAction = (!Permissions.r_ADD && !Permissions.r_EDIT)
                            ? ''
                            : `<a href="javascript:;" class="grid-action-icon Search" style="margin-left: 8px" onclick="empr_PurchaseBill.InitBarcodePickGrid()" title="Search"><i class="fa fa-search"></i></a>`;
                        const actions = `<div class="btn-group btn-group-sm">${copyAction}${addAction}${deleteAction}</div>`;
                        $(actions).appendTo(container);
                    }
                    else {

                        let costCenterAction = '';
                        debugger;
                        //if ($('#Code').val() != '') {
                        //    if (options.data.dT_CODE) {
                        //        costCenterAction = `<a href="javascript:;" class="grid-action-icon" style="margin-left: 10px; color:#FFD700" onclick="empr_PurchaseBill.ShowCostCenterModal(${options.data.traN_ID},${options.data.dT_CODE},'${options.data.dT_DESC}',${options.data.amt},${options.data.partY_CODE})"><i class="fa fa-coins"></i></a>`;
                        //    }
                        //}

                        $(`<div class="btn-group btn-group-sm">
                           <a href="javascript:;" class="grid-action-icon Clone" onclick="empr_PurchaseBill.CloneRow(`+ options.rowIndex + `)" title="Duplicate"><i class="fa fa-clone"></i></a>
                           <a href="javascript:;" class="grid-action-icon Add" style="margin-left: 8px" onclick="empr_PurchaseBill.AddRow()" title="Add"><i class="fa fa-add"></i></a>
                           <a href="javascript:;" class="grid-action-icon Delete" style="margin-left: 8px" onclick="empr_PurchaseBill.DeleteRow(${options.rowIndex},${options.data.dT_CODE})" title="Delete"><i class="fa fa-trash"></i></a>
                           </div>`).appendTo(container);
                    }
                }
            },
            {
                dataField: 'dT_CODE',
                caption: 'Code',
                visible: false,
            },
            {
                dataField: 'partY_CODE',
                visible: false
            },
            {
                dataField: 'acT_CODE',
                visible: false
            },

            {
                dataField: 'iteM_CODE',
                caption: 'Item',
                width: 320,
                minWidth: 150,
                //fixed: true,
                lookup: {
                    dataSource: {
                        store: Items,
                        paginate: true,
                        pageSize: 50
                    },
                    displayExpr: 'value',
                    valueExpr: 'key',
                    allowClearing: true,
                    searchEnabled: true,
                    showClearButton: true,
                },
                setCellValue: async function (newData, value, currentRowData) {
                    newData.iteM_CODE = value;
                    const item = Array.isArray(Items) ? Items.find(x => x.key === value) : null;

                    if (item) {
                        newData.unit = item.unit;
                        newData.hS_CODE = item.hscode;
                    }

                },
            },
            {
                dataField: 'hS_CODE',
                caption: 'HS Code',
                width: 110,
                allowEditing: false
            },
            {
                dataField: 'qty',
                caption: 'Qty',
                width: 75,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 },
                setCellValue: function (newData, value, currentRowData) {
                    newData.qty = value;
                    var calc = empr_PurchaseBill.CalculateDetailAmounts(newData.qty, currentRowData.rate, currentRowData.tax, currentRowData.f_TAX);
                    newData.amt = calc.amt;
                    newData.taX_AMT = calc.taX_AMT;
                    newData.f_TAX_AMT = calc.f_TAX_AMT;
                    newData.neT_AMT = calc.neT_AMT;
                    newData.w_AMT = ((parseFloat(value) || 0) * (parseFloat(currentRowData.w_RATE) || 0)).toFixed(2);
                }
            },
            {
                dataField: 'unit',
                caption: 'Unit',
                width: 100,
                alignment: 'center',
                defaultCellValue: function () {
                    if (Units && Units.length > 0) {
                        return Units[0].key;
                    }
                    return null;
                },
                lookup: {
                    dataSource: Units,
                    allowClearing: true,
                    displayExpr: 'value',
                    valueExpr: 'key'
                },

            },
            {
                dataField: 'rate',
                caption: 'Rate',
                width: 80,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 },
                setCellValue: function (newData, value, currentRowData) {
                    newData.rate = value;
                    var calc = empr_PurchaseBill.CalculateDetailAmounts(currentRowData.qty, newData.rate, currentRowData.tax, currentRowData.f_TAX);
                    newData.amt = calc.amt;
                    newData.taX_AMT = calc.taX_AMT;
                    newData.f_TAX_AMT = calc.f_TAX_AMT;
                    newData.neT_AMT = calc.neT_AMT;
                }
            },
            {
                dataField: 'amt',
                caption: 'Amount',
                width: 100,
                allowEditing: false,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 }
            },
            {
                dataField: 'w_RATE',
                caption: 'W.Rate',
                width: 80,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 },
                setCellValue: function (newData, value, currentRowData) {
                    newData.w_RATE = value;
                    newData.w_AMT = ((parseFloat(currentRowData.qty) || 0) * (parseFloat(value) || 0)).toFixed(2);
                }
            },
            {
                dataField: 'w_AMT',
                caption: 'W.Amt',
                width: 100,
                allowEditing: false,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 }
            },
            {
                dataField: 'tax',
                caption: 'Tax',
                width: 80,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 },
                setCellValue: function (newData, value, currentRowData) {
                    newData.tax = value;
                    var calc = empr_PurchaseBill.CalculateDetailAmounts(currentRowData.qty, currentRowData.rate, newData.tax, currentRowData.f_TAX);
                    newData.amt = calc.amt;
                    newData.taX_AMT = calc.taX_AMT;
                    newData.f_TAX_AMT = calc.f_TAX_AMT;
                    newData.neT_AMT = calc.neT_AMT;
                }
            },
            {
                dataField: 'taX_AMT',
                caption: 'Tax Amount',
                width: 120,
                allowEditing: false,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 }
            },
            {
                dataField: 'f_TAX',
                caption: 'Further Tax',
                width: 120,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 },
                setCellValue: function (newData, value, currentRowData) {
                    newData.f_TAX = value;
                    var calc = empr_PurchaseBill.CalculateDetailAmounts(currentRowData.qty, currentRowData.rate, currentRowData.tax, newData.f_TAX);
                    newData.amt = calc.amt;
                    newData.taX_AMT = calc.taX_AMT;
                    newData.f_TAX_AMT = calc.f_TAX_AMT;
                    newData.neT_AMT = calc.neT_AMT;
                }
            },
            {
                dataField: 'f_TAX_AMT',
                caption: 'Further Tax Amt',
                width: 150,
                allowEditing: false,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 }
            },
            {
                dataField: 'neT_AMT',
                caption: 'Net Amount',
                width: 120,
                allowEditing: false,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 }
            },
            {
                dataField: 'dT_DESC',
                caption: 'Description',
                width: 400,
                alignment: 'center',
                wordWrapEnabled: true,
            },
            //{
            //    dataField: 'deL_DATE',
            //    caption: 'Delivery Date',
            //    alignment: 'center',
            //    dataType: 'date',
            //    format: "dd-MM-yyyy",
            //    //defaultValue: new Date()
            //},
            //{
            //    dataField: 'paY_TERM',
            //    caption: 'Pay Terms',
            //    width: 70,
            //    dataType: 'number',
            //    format: { type: 'fixedPoint', precision: 0 },
            //    setCellValue: function (newData, value, currentRowData) {
            //        newData.paY_TERM = value;
            //        let deliveryDate = currentRowData.deL_DATE || new Date();
            //        if (deliveryDate && value) {
            //            let dueDate = new Date(deliveryDate);
            //            dueDate.setDate(dueDate.getDate() + parseInt(value));
            //            newData.duE_DATE = dueDate;
            //        }
            //    }
            //},
            //{
            //    dataField: 'duE_DATE',
            //    caption: 'Due Date',
            //    alignment: 'center',
            //    dataType: 'date',
            //    format: "dd-MM-yyyy",
            //    setCellValue: function (newData, value, currentRowData) {
            //        newData.duE_DATE = value;
            //        let deliveryDate = currentRowData.deL_DATE || new Date();
            //        if (deliveryDate && value) {
            //            let d1 = new Date(deliveryDate);
            //            let d2 = new Date(value);
            //            d1.setHours(0, 0, 0, 0);
            //            d2.setHours(0, 0, 0, 0);
            //            let timeDiff = d2.getTime() - d1.getTime();
            //            let daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
            //            newData.paY_TERM = daysDiff >= 0 ? daysDiff : 0;
            //        }
            //    }
            //},
            //{
            //    dataField: 'inC_EXC',
            //    caption: 'Inc / Exc',
            //    width: 100,
            //    alignment: 'center',
            //    lookup: {
            //        dataSource: empr_helper.Inc_Exc_Data,
            //        allowClearing: true,
            //        displayExpr: 'value',
            //        valueExpr: 'key'
            //    },

            //},
            //{
            //    dataField: 'bparty',
            //    caption: 'Broker',
            //    width: 200,
            //    alignment: 'center',
            //    lookup: {
            //        dataSource: {
            //            store: PartyType,
            //            paginate: true,
            //            pageSize: 50
            //        },
            //        allowClearing: true,
            //        displayExpr: 'value',
            //        valueExpr: 'key',
            //        searchEnabled: true,
            //        showClearButton: true,
            //    },
            //    setCellValue: function (newData, value, currentRowData) {
            //        newData.bparty = value;

            //        if (value) {
            //            const items = Array.isArray(PartyType) ? PartyType : (PartyType._array || []);
            //            const selectedParty = items.find(item => item.key === value);

            //            if (selectedParty) {
            //                newData.bpartY_CODE = selectedParty.partyCode;
            //                newData.bacT_CODE = selectedParty.accountCode;
            //            }
            //        } else {
            //            newData.bpartY_CODE = null;
            //            newData.bacT_CODE = null;
            //        }
            //    }
            //},
            //{
            //    dataField: 'comM_TYPE',
            //    caption: 'Comm.Type',
            //    width: 120,
            //    alignment: 'center',
            //    lookup: {
            //        dataSource: {
            //            store: empr_helper.comm_Type,
            //            paginate: true,
            //            pageSize: 50
            //        },
            //        allowClearing: true,
            //        displayExpr: 'value',
            //        valueExpr: 'key',
            //        searchEnabled: true,
            //        showClearButton: true,
            //    },

            //},
            //{
            //    dataField: 'comM_VALUE',
            //    caption: 'Comm.Value',
            //    width: 120,
            //    dataType: 'number',
            //    format: { type: 'fixedPoint', precision: 2 }
            //},
            {
                dataField: 'id',
                visible: false,
            },
            {
                dataField: 'picK_ID',
                caption: 'Pick ID',
                visible: false
            },
            {
                dataField: 'picK_ID_D',
                caption: 'Pick Detail ID',
                visible: false
            },
            //{
            //    dataField: 'vehicle',
            //    caption: 'Vehicle',
            //    width: 150,
            //    alignment: 'center',
            //    wordWrapEnabled: true,
            //    visible: false
            //},
            //{
            //    dataField: 'voucheR_NO', caption: 'Pick Tran#',
            //    allowEditing: false,
            //    alignment: 'center',
            //    fixedPosition: "right",
            //    cellTemplate: function (container, options) {
            //        $('<a>')
            //            .addClass('dx-link')
            //            .text(options.value)
            //            .attr('href', '#')
            //            .attr('onclick', 'empr_PurchaseBill.openVoucherPage(' + JSON.stringify(options.data.link) + ', ' + JSON.stringify(options.data.id) + ')')
            //            .appendTo(container);
            //    }
            //},
            {
                dataField: 'fbR_TYPE',
                caption: "Sale Type",
                allowSorting: false,
                width: 320,
                minWidth: 280,
                lookup: {
                    dataSource: {
                        store: fbrType,
                        paginate: true,
                    },
                    displayExpr: 'value',
                    valueExpr: 'key',
                    searchEnabled: true,
                    allowClearing: true
                },

                setCellValue: function (rowData, newValue, currentRowData) {
                    rowData.fbR_TYPE = newValue;

                    const selected = fbrType.find(x => x.key === newValue);
                    var taxRate = 0;

                    if (selected) {
                        rowData.iteM_SNO = selected.item_Sno;
                        rowData.schedulE_NO = selected.sche_No;
                        rowData.seriaL_NO = selected.seri_No;
                        taxRate = empr_PurchaseBill.GetFBRScenarioTax(selected.item_Sno);
                    } else {
                        rowData.iteM_SNO = "";
                        rowData.schedulE_NO = "";
                        rowData.seriaL_NO = "";
                    }

                    rowData.tax = taxRate;
                    var calc = empr_PurchaseBill.CalculateDetailAmounts(currentRowData.qty, currentRowData.rate, taxRate, currentRowData.f_TAX);
                    rowData.amt = calc.amt;
                    rowData.taX_AMT = calc.taX_AMT;
                    rowData.f_TAX_AMT = calc.f_TAX_AMT;
                    rowData.neT_AMT = calc.neT_AMT;
                }
            },
            {
                dataField: 'iteM_SNO',
                caption: 'Item SNO',
                width: 110,
                allowEditing: false
            },
            {
                dataField: 'schedulE_NO',
                caption: 'Schedule No',
                width: 130,
                allowEditing: false
            },
            {
                dataField: 'seriaL_NO',
                caption: 'Serial No',
                width: 110,
                allowEditing: false
            }
        ];
        empr_helper.editableDxGridbindingForTransactionsVouchers('#DetailContainer', col, dataSrc, "PurchaseBillGridV2", "iteM_CODE");
        var detailGrid = $('#DetailContainer').dxDataGrid('instance');
        detailGrid.option({
            height: 320,
            scrolling: {
                mode: 'standard',
                showScrollbar: 'always',
                scrollByThumb: true,
                scrollByContent: true,
                useNative: true
            }
        });
        if (dataSrc.length == 0) {
            detailGrid.addRow().done(function () {
                detailGrid.saveEditData();
            });
        }

    },

    CreateChargesGrid: function (dataSrc, dueCalc) {

        var col = [
            {
                dataField: "Action",
                width: 120,
                alignment: 'center',
                fixed: true,
                fixedPosition: "left",
                allowExporting: false,
                allowEditing: false,
                cellTemplate: function (container, options) {
                    $(`<div class="btn-group btn-group-sm">
                           <a href="javascript:;" class="grid-action-icon Add" style="margin-left: 8px" onclick="empr_PurchaseBill.AddChargesRow()" title="Add"><i class="fa fa-add"></i></a>
                           <a href="javascript:;" class="grid-action-icon Delete" style="margin-left: 8px" onclick="empr_PurchaseBill.DeleteChargesRow(${options.rowIndex},${options.data.code})" title="Delete"><i class="fa fa-trash"></i></a>
                           </div>`).appendTo(container);
                }
            },
            {
                dataField: 'chargeS_CODE',
                caption: 'Charges',
                alignment: 'center',
                lookup: {
                    dataSource: AllCharges,
                    //allowClearing: true,
                    displayExpr: 'value',
                    valueExpr: 'key'
                },

            },
            {
                dataField: 'sign',
                caption: 'Sign',
                width: 300,
                alignment: 'center',
                lookup: {
                    dataSource: [
                        { key: '+', value: '+', },
                        { key: '-', value: '-', },
                    ],
                    allowClearing: true,
                    displayExpr: 'value',
                    valueExpr: 'key'
                },

            },
            {
                dataField: 'amt',
                caption: 'Amount',
                width: 300,
                dataType: 'number',
                format: { type: 'fixedPoint', precision: 2 }
            },
            {
                dataField: 'code',
                caption: 'Code',
                visible: false
            },

        ];
        empr_helper.editableDxGridbindingForTransactionsVouchers('#ChargesGridContainer', col, dataSrc, "ChargesGrid");
        if (dataSrc.length == 0) {
            $('#ChargesGridContainer').dxDataGrid('instance').addRow().done(function () {
                $('#ChargesGridContainer').dxDataGrid('instance').saveEditData();
            });
        }

    },

    CloneRow: function (index) {
        const gridIns = $('#DetailContainer').dxDataGrid('instance');
        const dataSrc = gridIns.option("dataSource");

        if (dataSrc.length >= Limit && Limit != 0) {
            empr_helper.notify("You can only add  " + Limit + " records.", 2);
            return;
        }
        if ($('#DetailContainer').dxDataGrid('instance').hasEditData()) {
            $('#DetailContainer').dxDataGrid('instance').saveEditData().done(function () {

                empr_PurchaseBill.rowsCount += 1;
                const gridInstance = $('#DetailContainer').dxDataGrid('instance');
                var dataSource = gridInstance.option("dataSource");
                if (dataSource.length > 0) {
                    let clonedRowData = $.extend(true, {}, dataSource[index]);
                    if (clonedRowData.hasOwnProperty('dT_CODE')) {
                        delete clonedRowData.dT_CODE;
                    }
                    clonedRowData.__KEY__ = empr_PurchaseBill.GenerateKey(36);
                    clonedRowData.dT_CODE = 0;
                    let newDataSource = [clonedRowData].concat(dataSource);
                    gridInstance.option("dataSource", newDataSource);
                    gridInstance.refresh();
                }
            });
        }
        else {
            empr_PurchaseBill.rowsCount += 1;
            const gridInstance = $('#DetailContainer').dxDataGrid('instance');
            var dataSource = gridInstance.option("dataSource");
            if (dataSource.length > 0) {
                let clonedRowData = $.extend(true, {}, dataSource[index]);
                if (clonedRowData.hasOwnProperty('dT_CODE')) {
                    delete clonedRowData.dT_CODE;
                }
                clonedRowData.__KEY__ = empr_PurchaseBill.GenerateKey(36);
                clonedRowData.dT_CODE = 0;
                let newDataSource = [clonedRowData].concat(dataSource);
                gridInstance.option("dataSource", newDataSource);
                gridInstance.refresh();
            }
        }
    },

    CommCloneRow: function (index) {
        if (empr_PurchaseBill.pickIds.length > 0) {
            empr_helper.notify("Cannot clone row on return data.", 2);
        } else {
            const gridIns = $('#CommContainer').dxDataGrid('instance');
            const dataSrc = gridIns.option("dataSource");

            if (dataSrc.length >= Limit && Limit != 0) {
                empr_helper.notify("You can only add  " + Limit + " records.", 2);
                return;
            }
            if ($('#CommContainer').dxDataGrid('instance').hasEditData()) {
                $('#CommContainer').dxDataGrid('instance').saveEditData().done(function () {

                    empr_PurchaseBill.rowsCount += 1;
                    const gridInstance = $('#CommContainer').dxDataGrid('instance');
                    var dataSource = gridInstance.option("dataSource");
                    if (dataSource.length > 0) {
                        let clonedRowData = $.extend(true, {}, dataSource[index]);
                        if (clonedRowData.hasOwnProperty('dT_CODE')) {
                            delete clonedRowData.dT_CODE;
                        }
                        clonedRowData.__KEY__ = empr_PurchaseBill.GenerateKey(36);
                        clonedRowData.dT_CODE = 0;
                        let newDataSource = [clonedRowData].concat(dataSource);
                        gridInstance.option("dataSource", newDataSource);
                        gridInstance.refresh();
                    }
                });
            }
            else {
                empr_PurchaseBill.rowsCount += 1;
                const gridInstance = $('#CommContainer').dxDataGrid('instance');
                var dataSource = gridInstance.option("dataSource");
                if (dataSource.length > 0) {
                    let clonedRowData = $.extend(true, {}, dataSource[index]);
                    if (clonedRowData.hasOwnProperty('dT_CODE')) {
                        delete clonedRowData.dT_CODE;
                    }
                    clonedRowData.__KEY__ = empr_PurchaseBill.GenerateKey(36);
                    clonedRowData.dT_CODE = 0;
                    let newDataSource = [clonedRowData].concat(dataSource);
                    gridInstance.option("dataSource", newDataSource);
                    gridInstance.refresh();
                }
            }
        }
    },

    AddRow: function () {
        const gridIns = $('#DetailContainer').dxDataGrid('instance');
        const dataSrc = gridIns.option("dataSource");

        if (dataSrc.length >= Limit && Limit != 0) {
            empr_helper.notify("You can only add  " + Limit + " records.", 2);
            return;
        }
        if ($('#DetailContainer').dxDataGrid('instance').hasEditData()) {
            $('#DetailContainer').dxDataGrid('instance').saveEditData().done(function () {
                empr_PurchaseBill.rowsCount += 1;
                const gridInstance = $('#DetailContainer').dxDataGrid('instance');
                const dataSource = gridInstance.option("dataSource");
                let payTerm = parseInt($('#TERMS').val(), 10) || 0;
                var deliveryDate = $('#RINV_DATE').val();

                if (!deliveryDate) {
                    let today = new Date();
                    today.setHours(0, 0, 0, 0);
                    deliveryDate = today;
                }

                const newRow = {
                    __KEY__: empr_PurchaseBill.GenerateKey(36),
                    dT_CODE: 0,
                    //deL_DATE: todayDate,
                };

                dataSource.unshift(newRow);
                gridInstance.option("dataSource", dataSource);
                gridInstance.refresh();
                empr_helper.MoveFocusToGridWithouTab('#DetailContainer', 0, 'iteM_CODE')
            });
        }
        else {
            empr_PurchaseBill.rowsCount += 1;
            const gridInstance = $('#DetailContainer').dxDataGrid('instance');
            const dataSource = gridInstance.option("dataSource");

            let payTerm = parseInt($('#TERMS').val(), 10) || 0;

            var deliveryDate = $('#RINV_DATE').val();

            if (!deliveryDate) {
                let today = new Date();
                today.setHours(0, 0, 0, 0);
                deliveryDate = today;
            }

            const newRow = {
                __KEY__: empr_PurchaseBill.GenerateKey(36),
                dT_CODE: 0,
            };

            dataSource.unshift(newRow);
            gridInstance.option("dataSource", dataSource);
            gridInstance.refresh();
            empr_helper.MoveFocusToGridWithouTab('#DetailContainer', 0, 'iteM_CODE')
        }
    },

    DeleteRow: function (index, dtCode) {
        const gridInstance = $('#DetailContainer').dxDataGrid('instance');
        var dataSource = gridInstance.option("dataSource");
        if (dataSource.length > 0) {
            if (dataSource.length > 1) {
                var row = dataSource[index];
                if (dtCode == '' || dtCode == null || dtCode == undefined) {
                    gridInstance.deleteRow(index);
                    empr_PurchaseBill.rowsCount -= 1;
                    gridInstance.saveEditData();
                }
                else {
                    var availableRows = dataSource.filter(x => x.dT_CODE > 0);
                    if (availableRows.length > 0) {
                        swal({
                            title: 'Are you sure you want to remove this record?',
                            text: "You won't be able to revert this!",
                            type: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#0CC27E',
                            cancelButtonColor: '#FF586B',
                            confirmButtonText: 'Yes, delete it!',
                            cancelButtonText: 'No, cancel!',
                            confirmButtonClass: 'btn btn-success mr-5',
                            cancelButtonClass: 'btn btn-danger',
                            buttonsStyling: false
                        }).then(function () {
                            ajaxHelper.ajaxPostJsonData({ code: dtCode }, "/PurchaseBill/DeletePurchaseBillDetailByCode", function (data) {
                                empr_helper.notify(data.msg, data.msgType);
                                if (data.msgType == 1) {
                                    gridInstance.deleteRow(index);
                                    empr_PurchaseBill.rowsCount -= 1;
                                    gridInstance.saveEditData();
                                }
                            }, false, true);
                        });
                    } else {
                        empr_helper.notify("You are not allowed to delete the last row.", 2);
                    }
                }
            }
            else {
                empr_helper.notify("You are not allowed to delete the last row.", 2);
            }
        }
    },

    AddChargesRow: function () {
        const gridIns = $('#ChargesGridContainer').dxDataGrid('instance');
        const dataSrc = gridIns.option("dataSource");

        if ($('#ChargesGridContainer').dxDataGrid('instance').hasEditData()) {
            $('#ChargesGridContainer').dxDataGrid('instance').saveEditData().done(function () {
                const gridInstance = $('#ChargesGridContainer').dxDataGrid('instance');
                const dataSource = gridInstance.option("dataSource");



                const newRow = {
                    __KEY__: empr_PurchaseBill.GenerateKey(36),
                    code: 0,
                };

                dataSource.unshift(newRow);
                gridInstance.option("dataSource", dataSource);
                gridInstance.refresh();
            });
        }
        else {
            empr_PurchaseBill.rowsCount += 1;
            const gridInstance = $('#ChargesGridContainer').dxDataGrid('instance');
            const dataSource = gridInstance.option("dataSource");


            const newRow = {
                __KEY__: empr_PurchaseBill.GenerateKey(36),
                code: 0,
            };

            dataSource.unshift(newRow);
            gridInstance.option("dataSource", dataSource);
            gridInstance.refresh();
            empr_helper.MoveFocusToGridWithouTab('#ChargesGridContainer', 0, 'iteM_CODE')
        }
    },

    DeleteChargesRow: function (index, code) {
        const gridInstance = $('#ChargesGridContainer').dxDataGrid('instance');
        const tranId = $('#Code').val();
        var dataSource = gridInstance.option("dataSource");
        if (dataSource.length > 0) {
            if (dataSource.length > 1) {
                if (code == '' || code == null || code == undefined) {
                    gridInstance.deleteRow(index);
                    gridInstance.saveEditData();
                }
                else {
                    var availableRows = dataSource.filter(x => x.code > 0);
                    if (availableRows.length > 0) {
                        swal({
                            title: 'Are you sure you want to remove this record?',
                            text: "You won't be able to revert this!",
                            type: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#0CC27E',
                            cancelButtonColor: '#FF586B',
                            confirmButtonText: 'Yes, delete it!',
                            cancelButtonText: 'No, cancel!',
                            confirmButtonClass: 'btn btn-success mr-5',
                            cancelButtonClass: 'btn btn-danger',
                            buttonsStyling: false
                        }).then(function () {
                            debugger;
                            ajaxHelper.ajaxGetJson('/PurchaseBill/DeleteCharges?codee=' + code + '&tranId=' + tranId, function (data) {
                                empr_helper.notify(data.msg, data.msgType);
                                if (data.msgType == 1) {
                                    gridInstance.deleteRow(index);
                                    empr_PurchaseBill.rowsCount -= 1;
                                    gridInstance.saveEditData();
                                }
                            }, false, true);
                        });
                    } else {
                        empr_helper.notify("You are not allowed to delete the last row.", 2);
                    }
                }
            }
            else {
                empr_helper.notify("You are not allowed to delete the last row.", 2);
            }
        }
    },

    InitQuickSearchGrid: function () {
        empr_PurchaseBill.GetPurchaseBill();
    },

    GetPurchaseBill: function () {
        ajaxHelper.ajaxGetJson('/PurchaseBill/GetPurchaseBill', function (data) {
            if (data.msgType == 1) {
                empr_PurchaseBill.CreateQuickSearchGrid(data.data);
            }
            else {
                empr_helper.notify(data.msg, data.msgType);
            }
        }, false, true);
    },

    CreateQuickSearchGrid: function (dataSrc) {
        debugger;
        var col = [];
        if (dataSrc.length > 0 ? dataSrc[0].amt != undefined : false) { // detail wise
            col = [{
                dataField: "Action",
                width: 100,
                alignment: 'center',
                fixed: true,
                fixedPosition: "left",
                allowExporting: false,
                cellTemplate: function (container, options) {
                    if (Permissions != "Admin" && !Permissions.r_PRINT) {
                        $(`<div class="btn-group btn-group-sm">
                               <a href="javascript:;"  class="grid-action-icon elm_edit" reportid=${options.data.code} title="Edit"><i class="fa fa-edit"></i></a>
                               </div>`).appendTo(container);
                    } else {
                        $(`<div class="btn-group btn-group-sm">
                               <a href="javascript:;"  class="grid-action-icon elm_edit" reportid=${options.data.code} title="Edit"><i class="fa fa-edit"></i></a>
                               <a href="javascript:;"  class="grid-action-icon elm_print" style="margin-left: 8px" reportid=${options.data.code} title="PRINT"><i class="fa fa-print"></i></a>
                               <a href="javascript:;"  class="grid-action-icon elm_copy" style="margin-left: 8px" reportdate=${options.data.v_DATE} reportid=${options.data.code} title="COPY"><i class="fa fa-copy"></i></a>
                               </div>`).appendTo(container);
                    }
                }
            },
            { dataField: 'id', caption: 'Code', width: 90, alignment: "center" },
            { dataField: 'v_DATE', caption: 'Transaction Date', dataType: 'date', format: 'dd-MM-yyyy', width: 150 },
            { dataField: 'voucheR_NO', caption: 'Transaction #', alignment: 'center', width: 170 },
            {
                dataField: 'pvoucheR_NO', caption: 'Pick Tran#',
                allowEditing: false,
                alignment: 'center',
                width: 150,
                cellTemplate: function (container, options) {
                    $('<a>')
                        .addClass('dx-link')
                        .text(options.value)
                        .attr('href', '#')
                        .attr('onclick', 'empr_PurchaseBill.openVoucherPage(' + JSON.stringify(options.data.link) + ', ' + JSON.stringify(options.data.ptraN_ID) + ')')
                        .appendTo(container);
                }
            },
            { dataField: 'partY_NAME', caption: 'Party Name', minWidth: 220 },
            { dataField: 'warehouse', caption: 'Warehouse', width: 130 },
            { dataField: 'lot', caption: 'Lot', width: 110 },
            { dataField: 'iteM_NAME', caption: 'Item', minWidth: 200 },
            { dataField: 'ref', caption: 'Reference #', width: 140 },
            { dataField: 'remarks', caption: 'Comment', minWidth: 180 },
            { dataField: 'qty', caption: 'Qty', width: 90 },
            { dataField: 'rate', caption: 'Rate', width: 90 },
            { dataField: 'amt', caption: 'Amount', width: 110 },
            { dataField: 'astatus', caption: 'Status', width: 100 },
            ];
        }
        else {
            col = [{
                dataField: "Action",
                width: 100,
                alignment: 'center',
                fixed: true,
                fixedPosition: "left",
                allowExporting: false,
                cellTemplate: function (container, options) {


                    $(`<div class="btn-group btn-group-sm">
                               <a href="javascript:;"  class="grid-action-icon elm_edit" reportid=${options.data.code} title="Edit"><i class="fa fa-edit"></i></a>
                               <a href="javascript:;"  class="grid-action-icon elm_print" style="margin-left: 8px" reportid=${options.data.code} title="PRINT"><i class="fa fa-print"></i></a>
                               <a href="javascript:;"  class="grid-action-icon elm_copy" style="margin-left: 8px" reportdate=${options.data.v_DATE} reportid=${options.data.code} title="COPY"><i class="fa fa-copy"></i></a>
                               </div>`).appendTo(container);
                }
            },
            { dataField: 'id', caption: 'Code', width: 90, alignment: "center" },
            { dataField: 'v_DATE', caption: 'Transaction Date', dataType: 'date', format: 'dd-MM-yyyy', width: 150 },
            { dataField: 'voucheR_NO', caption: 'Transaction #', alignment: 'center', width: 170 },
            { dataField: 'astatus', caption: 'Status', width: 100 },
            { dataField: 'partY_NAME', caption: 'Party Name', minWidth: 240 },
            { dataField: 'ref', caption: 'Reference #', width: 140 },
            { dataField: 'fbR_NO', caption: 'FBR Response', minWidth: 180 },
            { dataField: 'remarks', caption: 'Comment', minWidth: 200 },
                //{ dataField: 'rinV_NO', caption: 'R.Inv No', },
                //{ dataField: 'rinV_DATE', caption: 'R.Inv Date', dataType: 'date', format: 'dd-MM-yyy' },
            ]
        }
        //empr_helper.dxGridbindingLazyLoading('#gridContainer', col, "/PurchaseBill/GetPurchaseBill", "id", "PartyOpening");
        empr_helper.dxGridbindingVouchers('#gridContainer', col, dataSrc, "PurchaseBillQSV2", "single");
        setTimeout(function () {
            $('#gridContainer').dxDataGrid('instance').resize();
        }, 500);
    },

    ShowFbrResponse: function () {
        var res = $.trim($('#FBR_RES').val());
        var $head = $('#fbrResHead').removeClass('is-success');
        var $icon = $('#fbrResIcon').attr('class', 'fa-solid fa-triangle-exclamation');

        if (res === '') {
            $head.addClass('is-success');
            $icon.attr('class', 'fa-solid fa-circle-info');
            $('#fbrResTitle').text('FBR Response');
            $('#fbrResCode').text('');
            $('#fbrResDesc').text('This invoice has not been posted to FBR yet.');
        } else if (/^\S+$/.test(res)) {
            $head.addClass('is-success');
            $icon.attr('class', 'fa-solid fa-circle-check');
            $('#fbrResTitle').text('Verified by FBR');
            $('#fbrResCode').text('FBR Invoice No: ' + res);
            $('#fbrResDesc').text('This invoice has been successfully verified by FBR.');
        } else {
            var match = res.match(/^\s*([A-Za-z0-9]+)\s*:\s*([\s\S]*)$/);
            $('#fbrResTitle').text('FBR Error');
            $('#fbrResCode').text(match ? 'Error Code: ' + match[1] : '');
            $('#fbrResDesc').text(match ? match[2] : res);
        }
        $('#fbrResModal').modal('show');
    },

    GetPurchaseBillByCode: function (code, openInView) {
        empr_PurchaseBill.ResetForm();
        ajaxHelper.ajaxGetJson('/PurchaseBill/GetPurchaseBillByCode?code=' + code, function (data) {
            if (data.master.msgType == 1) {
                empr_PurchaseBill.alreadySaved = data
                var masterData = data.master.data;
                console.log('edit Data', data);
                if (masterData.length == 1) {
                    //$('#pickItems').show();
                    //empr_PurchaseBill.pickIds = [];
                    var response = masterData[0];
                    empr_PurchaseBill.vDate = response.v_DATE;
                    var filteredData = $.grep(PartyType, function (item) {
                        return item.partyCode === response.partY_CODE;
                    });
                    var fbrNo = response.fbR_NO || "";
                    debugger;
                    $('#FBR_RES').val(fbrNo);

                    var isValidFbrNo = fbrNo !== "" && /^\S+$/.test(fbrNo);

                    if (isValidFbrNo) {

                        $('#FBR_RES').css('color', 'black');

                        if (data.qrcode && data.qrcode !== "") {
                            $("#qrImg")
                                .attr("src", "data:image/png;base64," + data.qrcode)
                                .show();
                        }

                    } else {

                        $('#FBR_RES').css('color', 'red');

                        $("#qrImg")
                            .attr("src", "/Client/Company/notPostedYet.jpg");
                    }
                    //$('#btnLedger').show();
                    $('#Code').val(response.id);
                    $('#ASTATUS').dxSelectBox('instance').option('value', response.astatus);
                    $('#PARTY_CODE').dxSelectBox('instance').option('value', filteredData[0].key);
                    $('#partyhidden').val(filteredData[0].partyCode);
                    //$('#FBR_RES').val(response.fbR_NO);
                    $('#REF').val(response.ref);
                    $('#REMARKS').val(response.remarks);
                    $('#ORDER_TYPE').val(response.ordeR_TYPE);

                    $('#V_DATE').val(response.v_DATE);
                    $('#VOUCHER_NO').val(response.voucheR_NO);

                    $('#hdnDOC').val(response.doc);
                    var DocPath = response.doc;
                    var DocName = DocPath.split('/').pop();
                    $("#DOCName").val(DocName);

                    if (Permissions != "Admin") {
                        if ($('#FBR_RES').val().trim() === "") {
                            if (Permissions.r_DLT) {
                                if (isValidFbrNo) {
                                    $('#BtnDelete').show();
                                }
                            }
                            if (Permissions.r_EDIT) {
                                $('#BtnSave').show();
                                $('#BtnfBRpOST').show();
                            }
                            else {
                                $('#BtnSave').hide();
                            }
                        } else {
                            $('#BtnSave').hide();
                            $('#BtnDelete').hide();
                        }
                    } else {
                        if ($('#FBR_RES').val().trim() === "" || !isValidFbrNo) {
                            $('#BtnfBRpOST').show();
                        } else {
                            $('#BtnfBRpOST').hide();
                            $("#verifiedText").show();
                        }
                        $('#BtnSave').show();
                    }
                    if (isValidFbrNo) {
                        $('#BtnDelete').show();
                        $('#fbrVerifiedNote').css('display', 'inline-flex');
                    }

                    if (openInView && isValidFbrNo) {
                        empr_PurchaseBill.ShowInvoiceView(response.id, isValidFbrNo);
                    }
                }
                //$('#charges-tab-li').removeClass('d-none');



                if (data.detail.msgType == 1) {
                    var updatedDetailData = data.detail.data.map(item => {
                        let stockRecord = empr_PurchaseBill.CurrentStock.find(s =>
                            String(s.itemId) === String(item.iteM_CODE) &&
                            String(s.warehouse) === String(item.warehouse) &&
                            String(s.lot || "").trim() === String(item.lot || "").trim()
                        );

                        return {
                            ...item,
                            currentStock: stockRecord ? Number((parseFloat(stockRecord.balance) || 0).toFixed(2)) : 0
                        };
                    });

                    empr_PurchaseBill.CreateGrid(updatedDetailData, false);
                }
                else {
                    empr_helper.notify(data.detail.msg, data.detail.msgType);
                }


                debugger;
                if (data.charges.data.length > 0) {

                    empr_PurchaseBill.CreateChargesGrid(data.charges.data, false);
                }
                else {
                    empr_PurchaseBill.CreateChargesGrid(data.defaultCharges);
                }

            }
            else {
                empr_helper.notify(data.master.msg, data.master.msgType);
            }
        }, false, true);
    },

    //GetPurchaseBillDetailByCode: function (code) {
    //    ajaxHelper.ajaxGetJson('/PurchaseBill/GetPurchaseBillDetailByCode?code=' + code, function (data) {
    //        if (data.msgType == 1) {
    //            empr_PurchaseBill.CreateGrid(data.data);
    //        }
    //        else {
    //            empr_helper.notify(data.msg, data.msgType);
    //        }
    //    }, false, true);
    //},

    GetDataToSave: function () {
        var ID = $("#Code").val();
        var ASTATUS = $('#ASTATUS').dxSelectBox('option', 'value');
        var V_DATE = $("#V_DATE").val();
        var VOUCHER_NO = $("#VOUCHER_NO").val();
        var PARTY_CODE = $("#partyhidden").val();
        var ACT_CODE = 0;
        var BTYPE = $("#BTYPE").dxSelectBox('option', 'value');
        var REF = $("#REF").val();
        var DOC = $("#hdnDOC").val();
        var ORDER_TYPE = $("#ORDER_TYPE").val();
        var REMARKS = $("#REMARKS").val();

        var masterRecord = {
            TRAN_ID: ID,
            ASTATUS: ASTATUS,
            V_DATE: V_DATE,
            VOUCHER_NO: VOUCHER_NO,
            ORDER_TYPE: ORDER_TYPE,
            PARTY_CODE: PARTY_CODE,
            ACT_CODE: ACT_CODE,
            BTYPE: BTYPE,
            REF: REF,
            DOC: DOC,
            REMARKS: REMARKS
        }
        var detailRecords = [];
        if ($('#DetailContainer').dxDataGrid('instance').hasEditData()) {
            $('#DetailContainer').dxDataGrid('instance').saveEditData().done(function () {
                detailRecords = $('#DetailContainer').dxDataGrid('instance').option("dataSource");
            });
        }
        else {
            detailRecords = $('#DetailContainer').dxDataGrid('instance').option("dataSource");
        }

        if (empr_PurchaseBill.rowsCount == detailRecords.length) {
            var modelRecord = {
                Master: masterRecord,
                Detail: detailRecords,
            };
            return modelRecord;
        }
        else {

            var detailRecords = $('#DetailContainer').dxDataGrid('instance').option("dataSource");

            $.each(detailRecords, function (index, item) {
                if (!(item.duE_DATE == "" || item.duE_DATE == null || item.duE_DATE == undefined)) {
                    item.duE_DATE = empr_helper.PrepareDate(item.duE_DATE);
                }

                if (!(item.deL_DATE == "" || item.deL_DATE == null || item.deL_DATE == undefined)) {
                    item.deL_DATE = empr_helper.PrepareDate(item.deL_DATE);
                }
            });

            var modelRecord = {
                Master: masterRecord,
                Detail: detailRecords,
            };
            return modelRecord;
        }
    },

    ValidateMainInfo: function () {

        var valid = true;
        var data = empr_PurchaseBill.GetDataToSave();

        if (data.Master.V_DATE == '') {
            empr_helper.notify("Transaction date is required.", 2);
            valid = false;
            return valid;
        }

        if (data.Master.PARTY_CODE == '') {
            empr_helper.notify("Please select Party.", 2);
            valid = false;
            return valid;
        }

        data.Detail = $('#DetailContainer').dxDataGrid('instance').option("dataSource");

        if (data.Detail.length == 0) {
            empr_helper.notify("Please add items.", 2);
            valid = false;
            return valid;
        }

        $.each(data.Detail, function (index, item) {
            if (item.iteM_CODE == "" || item.iteM_CODE == null || item.iteM_CODE == undefined) {
                empr_helper.notify("Please select Item at Line No " + (index + 1), 2);
                valid = false;
                return valid;
            }
            if (item.qty == "" || item.qty == null || item.qty == undefined) {
                empr_helper.notify("Please enter item quantity at Line No " + (index + 1), 2);
                valid = false;
                return valid;
            }

            if (item.qty <= 0) {
                empr_helper.notify("Please enter correct item quantity at Line No " + (index + 1), 2);
                valid = false;
                return valid;
            }

            if (item.rate == "" || item.rate == null || item.rate == undefined) {
                empr_helper.notify("Please enter rate at Line No " + (index + 1), 2);
                valid = false;
                return valid;
            }

            if (item.rate <= 0) {
                empr_helper.notify("Please enter correct rate at Line No " + (index + 1), 2);
                valid = false;
                return valid;
            }

            //if (item.warehouse == "" || item.warehouse == null || item.warehouse == undefined) {
            //    empr_helper.notify("Please select warehouse at Line No " + (index + 1), 2);
            //    valid = false;
            //    return valid;
            //}

            //if (item.lot == "" || item.lot == null || item.lot == undefined) {
            //    empr_helper.notify("Please select lot at Line No " + (index + 1), 2);
            //    valid = false;
            //    return valid;
            //}

            //if (item.picK_ID_D == "" || item.picK_ID_D == null || item.picK_ID_D == undefined) {
            //    empr_helper.notify("Line #" + (index + 1) + " is not picked. Only picked rows allowed.", 2);
            //    valid = false;
            //    return valid;
            //}
            if (item.fbR_TYPE == 0 || item.fbR_TYPE == null || item.fbR_TYPE == undefined) {
                empr_helper.notify("Please Select FBR Type on Line No " + (index + 1), 2);
                valid = false;
                return valid;
            }
        });

        if (data.Detail.length > Limit && Limit != 0) {
            empr_helper.notify("You can only add  " + Limit + " records.", 2);
            valid = false;
            return valid;
        }

        return valid;
    },

    Save: function () {
        var dataModel = empr_PurchaseBill.GetDataToSave();
        if (dataModel.Master.TRAN_ID == 0
            || dataModel.Master.TRAN_ID == null
            || dataModel.Master.TRAN_ID == undefined
            || dataModel.Master.TRAN_ID == "") {
            dataModel.Detail.reverse();
        }
        console.log('save attempt', dataModel);
        ajaxHelper.ajaxPostJsonData(dataModel, "/PurchaseBill/Save", function (data) {
            empr_helper.notify(data.msg, data.msgType);
            if (data.msgType == 1) {
                if (dataModel.Master.TRAN_ID == 0
                    || dataModel.Master.TRAN_ID == null
                    || dataModel.Master.TRAN_ID == undefined) {
                    $('#Code').val(data.data.code);
                    empr_helper.selectedBill = data.data.code;
                    $('#VOUCHER_NO').val(data.data.voucherNo);
                }
                if (dataClear == 1) {
                    empr_PurchaseBill.GetPurchaseBillByCode(data.data.code);
                    $('#BtnDelete').show();
                }
                else {
                    $("#SCODE").dxSelectBox("instance")?.option("value", "");
                    empr_PurchaseBill.ResetForm();
                }

            }
        }, false, true);
    },

    ShowInvoiceView: function (code, isVerified) {
        var reportType = $('#ReportType').dxSelectBox('instance');
        var mdId = reportType ? (reportType.option('value') || 0) : 0;
        ajaxHelper.ajaxGetJson('/PurchaseBill/GetInvoiceViewData?code=' + code + '&mdId=' + mdId, function (data) {
            if (data.msgType != 1) {
                empr_helper.notify(data.msg, 2);
                return;
            }
            var fmt = function (n, min, max) {
                return (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max });
            };
            var m = data.master;
            $('#ivInvoiceNo').text(m.invoiceNumber || '');
            $('#ivDate').text(m.date || '');
            $('#ivRef').text(m.refNo || '');
            $('#ivFbrNo, #ivFbrNo2').text(isVerified ? (m.fbrNo || '') : '');
            $('#ivSupplierName').text(m.supplierName || '');
            $('#ivSupplierAddress').text(m.supplierAddress || '');
            $('#ivSupplierTel').text(m.supplierTel || '—');
            $('#ivSupplierStrn').text(m.supplierStrn || '');
            $('#ivSupplierNtn').text(m.supplierNtn || '');
            $('#ivBuyerName').text(m.buyerName || '');
            $('#ivBuyerAddress').text(m.buyerAddress || '');
            $('#ivBuyerTel').text(m.buyerTel || '—');
            $('#ivBuyerStrn').text(m.buyerStrn || '');
            $('#ivBuyerNtn').text(m.buyerNtn || '');

            $('#ivQrImg').attr('src', $('#qrImg').attr('src'));
            $('#ivVerified, #ivFbrBox').toggle(isVerified);

            var totalQty = 0, totalAmt = 0, totalTax = 0, totalNet = 0;
            var $body = $('#ivItems').empty();
            $.each(data.items || [], function (i, item) {
                totalQty += parseFloat(item.qty) || 0;
                totalAmt += parseFloat(item.amt) || 0;
                totalTax += parseFloat(item.taxAmt) || 0;
                totalNet += parseFloat(item.netAmt) || 0;
                $('<tr>')
                    .append($('<td>').text((item.hsCode || '') + ' - ' + (item.itemName || '')))
                    .append($('<td class="text-center">').text(item.unit || ''))
                    .append($('<td class="text-end">').text(fmt(item.qty, 2, 2)))
                    .append($('<td class="text-end">').text(fmt(item.rate, 2, 4)))
                    .append($('<td class="text-center">').text(fmt(item.tax, 0, 2) + '%'))
                    .append($('<td class="text-end">').text(fmt(item.taxAmt, 2, 2)))
                    .append($('<td class="text-end">').text(fmt(item.netAmt, 2, 2)))
                    .appendTo($body);
            });
            if ((data.items || []).length < 3) {
                $('<tr class="iv-filler"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').appendTo($body);
            }

            $('#ivTotalQty').text(fmt(totalQty, 2, 2));
            $('#ivTotalAmt').text(fmt(totalAmt, 0, 2));
            $('#ivTotalTax').text(fmt(totalTax, 2, 2));
            $('#ivNetTotal').text(fmt(totalNet, 2, 2));
            $('#ivWords').text(empr_PurchaseBill.AmountInWords(totalNet));

            $('#pbHeadSub').text(isVerified ? 'FBR Digital Invoice – Validated by FBR' : 'FBR Digital Invoice – Not Posted to FBR');
            $('#ivBtnDelete').toggle($('#BtnDelete').css('display') !== 'none');
            $('#ivBtnSave').toggle($('#BtnSave').css('display') !== 'none' && !isVerified);
            $('#ivBtnEdit').hide();
            $('.pb-form').addClass('pb-view-mode');
        }, false, true);
    },

    HideInvoiceView: function () {
        $('.pb-form').removeClass('pb-view-mode');
        $('#pbHeadSub').text('FBR Digital Invoice • Master Detail View');
    },

    ExportInvoicePdf: function () {
        var MD_ID = 0, reportName = '';
        var selectedItem = $('#ReportType').dxSelectBox('option', 'selectedItem');
        if (selectedItem) {
            MD_ID = selectedItem.mD_ID;
            reportName = selectedItem.reporT_NAME;
        }
        var dataModel = {
            TRAN_ID: empr_helper.selectedBill,
            MD_ID: MD_ID,
            REPORT_NAME: reportName,
            BALANCE: $('#PARTY_BALANCE').val(),
        };
        ajaxHelper.ajaxPostJsonData(dataModel, "/PurchaseBill/GetPrintReport", function (data) {
            if (data.msgType == 1) {
                var link = document.createElement('a');
                link.href = window.location.origin + data.data;
                link.download = data.data.split('/').pop();
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
            else {
                empr_helper.notify(data.msg, data.msgType);
            }
        }, false, true);
    },

    AmountInWords: function (amount) {
        var ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        var below1000 = function (n) {
            var s = '';
            if (n >= 100) {
                s = ones[Math.floor(n / 100)] + ' Hundred';
                n = n % 100;
                if (n) s += ' And ';
            }
            if (n >= 20) {
                s += tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
            } else if (n > 0) {
                s += ones[n];
            }
            return s;
        };
        var value = Math.abs(parseFloat(amount) || 0);
        var whole = Math.floor(value);
        var paisa = Math.round((value - whole) * 100);
        if (whole === 0 && paisa === 0) return 'Zero Only';
        var scales = ['', ' Thousand', ' Million', ' Billion'];
        var parts = [], i = 0;
        while (whole > 0) {
            var chunk = whole % 1000;
            if (chunk) parts.unshift(below1000(chunk) + scales[i]);
            whole = Math.floor(whole / 1000);
            i++;
        }
        var words = parts.join(' ');
        if (paisa) words += (words ? ' And ' : '') + below1000(paisa) + ' Paisa';
        return words + ' Only';
    },

    ResetForm: function () {
        empr_PurchaseBill.HideInvoiceView();
        $('.detailInfo a').tab('show');
        empr_PurchaseBill.CreateGrid([{ __KEY__: empr_PurchaseBill.GenerateKey(36), dT_CODE: 0, }]);
        empr_PurchaseBill.CreateChargesGrid(DefaultCharges);

        $('#Code').val('');
        $('#qrImg').attr('src', '/Client/Company/notPostedYet.jpg');
        $("#hdnDOC").val('');
        $("#DOCName").val('');
        $("#FBR_RES").val('');
        $("#hdnDOC").val('');
        $('#BtnDelete').hide();
        $('#REMARKS').val('');
        $('#REF').val('');
        $('#VOUCHER_NO').val('');
        $('#ORDER_TYPE').val('');
        $('#charges-tab-li').addClass('d-none');
        $('#BTYPE').dxSelectBox('instance').option('value', 'CR');

        empr_helper.dcType = dcType;
        empr_PurchaseBill.pickIds = [];
        empr_PurchaseBill.InitPartyType();

        $('#V_DATE').val(todayDate);
        $('#V_DATE').focus();
        $('#pickItems').show();
        $('#BtnfBRpOST').show();
        $("#verifiedText").hide();
        $('#fbrVerifiedNote').hide();
        if (Permissions != "Admin") {
            if (Permissions.r_ADD) {
                $('#BtnSave').show();
            } else {
                $('#BtnSave').hide();
            }
        } else {
            $('#BtnSave').show();
        }
    },

    Delete: function () {

        swal({
            title: 'Are you sure you want to remove this record?',
            text: "You won't be able to revert this!",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#FF586B',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            confirmButtonClass: 'btn btn-success mr-5',
            cancelButtonClass: 'btn btn-danger',
            buttonsStyling: false
        }).then(function () {
            ajaxHelper.ajaxPostJsonData({ code: $('#Code').val() }, "/PurchaseBill/Delete", function (data) {
                empr_helper.notify(data.msg, data.msgType);
                if (data.msgType == 1) {
                    $("#SCODE").dxSelectBox("instance")?.option("value", "");
                    empr_PurchaseBill.ResetForm();
                    $('#BtnDelete').hide();
                }
            }, false, true);
        });
    },

    UploadDoc: function () {
        $('#BtnSave').prop('disabled', true);
        var files = document.getElementById('DOC').files;
        var formData = new FormData();
        for (var i = 0; i !== files.length; i++) {
            formData.append("model", files[i]);
        }
        $.ajax(
            {
                url: "/Common/UploadVoucherDocs",
                data: formData,
                processData: false,
                contentType: false,
                type: "POST",
                success: function (data) {
                    if (data.msgType == '1') {
                        $("#hdnDOC").val(data.data);
                    }
                    else {
                        empr_helper.notify("Something went wrong while saving the file. please re-upload the file.", data.msgType);
                    }
                    $('#BtnSave').prop('disabled', false);

                }
            }
        );
    },

    OpenDoc: function () {
        var hdnUrl = $('#hdnDOC').val();
        if (hdnUrl == "" || hdnUrl == null) {
            empr_helper.notify("Please upload a file to view.", 2);
        }
        else {
            const fileURL = window.location.origin + hdnUrl;
            window.open(fileURL, '_blank');
        }
    },

    GenerateKey: function (keyLength) {

        var key = "";
        var characters = "abcdef0123456789";
        for (var i = 0; i < keyLength; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                key += "-";
            } else {
                key += characters.charAt(Math.floor(Math.random() * characters.length));
            }
        }
        return key;
    },

    InitPartyType: function (selectedValue) {
        $('#PARTY_CODE').dxSelectBox({
            dataSource: new DevExpress.data.DataSource({
                store: PartyType,
                paginate: true,
                pageSize: 30
            }),
            displayExpr: 'value',
            valueExpr: 'key',
            value: selectedValue,
            searchEnabled: true,
            width: '100%',
            placeholder: 'Select',
            showClearButton: true,
            dropDownOptions: {
                height: 150
            },
            searchTimeout: 500,
            onValueChanged: function (d) {
                empr_PurchaseBill.OnPartyChange(d);
            }
        });
    },

    OnPartyChange: function (d) {

        if (d.value == null || d.value == '') {
            $('#partyhidden').val('');
            $('#acthidden').val('');
            $('#PARTY_BALANCE').val('');
        }
        else {
            var filteredData = $.grep(PartyType, function (item) {
                return item.key === d.value;
            });

            $('#partyhidden').val(filteredData[0].partyCode);
            $('#acthidden').val('');

            var code = $('#Code').val();
            if (code) {
                ajaxHelper.ajaxGetJson('/PurchaseBill/GetPartyCurrentBalance?vDate=' + empr_PurchaseBill.vDate, function (data) {
                    if (data.length > 0) {
                        var newPartyData = $.grep(data, function (item) {
                            return item.key === d.value;
                        });

                        let balance = parseFloat(newPartyData[0].balance || 0);

                        if (balance < 0) {
                            $('#PARTY_BALANCE').val(`(${Math.abs(balance)})`).css('color', 'red');
                        } else {
                            $('#PARTY_BALANCE').val(balance).css('color', 'black');
                        }
                    }
                }, false, true);
            }
            else {
                let balance = parseFloat(filteredData[0].balance || 0);

                if (balance < 0) {
                    $('#PARTY_BALANCE').val(`(${Math.abs(balance)})`).css('color', 'red');
                } else {
                    $('#PARTY_BALANCE').val(balance).css('color', 'black');
                }
            }

        }
    },

    InitReportTypeDDL: function (selectedValue) {
        ajaxHelper.ajaxGetJson("/PurchaseBill/GetReportTypes", function (data) {
            if (data.msgType == 1) {
                if (data.data.length > 0) {
                    selectedValue = data.data[0].mD_ID;
                }
                $('#ReportType').dxSelectBox({
                    dataSource: data.data,
                    displayExpr: 'mD_NAME',
                    valueExpr: 'mD_ID',
                    value: selectedValue,
                    searchEnabled: true,
                    width: '100%',
                    placeholder: 'Select',
                    showClearButton: true,
                    dropDownOptions: {
                        height: 'auto',
                    },
                    pagingEnabled: true,
                    searchTimeout: 500,
                    onValueChanged: function (e) {
                    },
                });
            }
            else {
                empr_helper.notify(data.data, data.msgType);
            }
        }, false, true);
    },

    GeneratePrintReport: function () {
        let TRAN_ID = empr_helper.selectedBill;
        let MD_ID = 0;
        let reportName = "";
        let selectedItem = $('#ReportType').dxSelectBox('option', 'selectedItem');
        let balance = $('#PARTY_BALANCE').val()
        if (selectedItem) {
            MD_ID = selectedItem.mD_ID;
            reportName = selectedItem.reporT_NAME;
        }
        if (TRAN_ID == 0 || TRAN_ID == null || TRAN_ID == undefined || TRAN_ID == "") {
            empr_helper.notify("Please open the bill in edit mode.", 2);
            return;
        }
        var dataModel = {
            TRAN_ID: TRAN_ID,
            MD_ID: MD_ID,
            REPORT_NAME: reportName,
            BALANCE: balance,
        }
        $("#Loader").show();
        $("#Loader").css('display', 'flex');
        var xhr = ajaxHelper.ajaxPostJsonData(dataModel, "/PurchaseBill/GetPrintReport", function (data) {
            console.log('report', data);
            try {
                if (data.msgType == 1) {

                    $('#ModalBody').empty();
                    $('#ReportType').dxSelectBox('instance').option('value', MD_ID);
                    $('#ModalBody').html("<center><object id='objReport' data='" + window.location.origin + data.data + "' width='1100' height='600'></object></center>");
                    $('#ShowReportModal').show();
                    $('#ShowReportModal').modal('show');
                }
                else {
                    empr_helper.notify(data.msg, data.msgType);
                }
            } finally {
                $("#Loader").hide();
            }
        }, true);
        if (xhr && xhr.fail) {
            xhr.fail(function () {
                $("#Loader").hide();
            });
        }
    },

    UploadDoc: function () {
        $('#saveAttempt').prop('disabled', true);
        var files = document.getElementById('DOC').files;
        if (files.length > 0) {
            $('#DOCName').val(files[0].name);
        }

        var formData = new FormData();
        for (var i = 0; i !== files.length; i++) {
            formData.append("model", files[i]);
        }

        $.ajax({
            url: "/Common/UploadVoucherDocs",
            data: formData,
            processData: false,
            contentType: false,
            type: "POST",
            success: function (data) {
                if (data.msgType == '1') {
                    $("#hdnDOC").val(data.data);
                } else {
                    $('#DOCName').val("No File");
                    empr_helper.notify("Something went wrong while saving the file. Please re-upload.", 2);
                }
                $('#saveAttempt').prop('disabled', false);
            }
        });
    },

    OpenDoc: function () {
        var hdnUrl = $('#hdnDOC').val();
        if (!hdnUrl) {
            empr_helper.notify("Please upload a file to view.", 2);
        } else {
            const fileURL = window.location.origin + hdnUrl;
            window.open(fileURL, '_blank');
        }
    },

    openVoucherPage(link, tran_Id) {
        var newWindow = window.open(link, '_blank');
        newWindow.addEventListener('load', function () {
            setTimeout(function () {
                newWindow.postMessage({ traN_ID: tran_Id }, '*');
            }, 1000);
        });
    },

    InitRegionDDL: function (selectedValue) {

        $('#REGION').dxSelectBox({
            dataSource: Regions,
            displayExpr: 'value',
            valueExpr: 'key',
            value: selectedValue,
            searchEnabled: true,
            width: '100%',
            placeholder: 'Search',
            showClearButton: true,
            dropDownOptions: {
                height: 'auto',
            },
            pagingEnabled: true,
            searchTimeout: 500,
        });
    },
    InitWarehouseDDL: function (selectedValue) {

        $('#WAREHOUSE').dxSelectBox({
            dataSource: Warehouse,
            displayExpr: 'value',
            valueExpr: 'key',
            value: selectedValue,
            searchEnabled: true,
            width: '100%',
            placeholder: 'Search',
            showClearButton: true,
            dropDownOptions: {
                height: 'auto',
            },
            pagingEnabled: true,
            searchTimeout: 500,
        });
    },

    GetAndPostDataToApi: function (code) {
        debugger;
        var dataModel = empr_PurchaseBill.GetDataToSave();
        var alreadSaved = empr_PurchaseBill.alreadySaved;

        if (dataModel != null && alreadSaved != null) {

            var dataMaster = dataModel.Master;
            var dataDetail = dataModel.Detail;

            var savedMaster = alreadSaved.master.data[0];
            var savedDetail = alreadSaved.detail.data;

            var masterMatch = deepCompare(dataMaster, savedMaster);
            var detailMatch = deepCompare(dataDetail, savedDetail);

            console.log("Master Match:", masterMatch);
            console.log("Detail Match:", detailMatch);

            if (!masterMatch || !detailMatch) {
                $("#Loader").hide();
                empr_helper.notify("Please Save First", 2);
                return;
            }
        }
        else {
            $("#Loader").hide();
            empr_helper.notify("Please Save First", 2);
            return;
        }

        function normalizeForCompare(obj) {

            if (obj === null || obj === undefined) {
                return "";
            }

            if (Array.isArray(obj)) {
                return obj.map(function (item) {
                    return normalizeForCompare(item);
                });
            }

            if (typeof obj === "object") {

                var result = {};

                Object.keys(obj).forEach(function (key) {

                    var newKey = key.toUpperCase();

                    // ID -> TRAN_ID
                    if (newKey === "ID") {
                        newKey = "TRAN_ID";
                    }

                    // Ignore extra fields
                    if (newKey === "FBR_NO" || newKey === "CURRENTSTOCK") {
                        return;
                    }

                    result[newKey] = normalizeForCompare(obj[key]);
                });

                return result;
            }

            return String(obj);
        }


        function deepCompare(obj1, obj2) {

            var a = normalizeForCompare(obj1);
            var b = normalizeForCompare(obj2);

            function stableStringify(obj) {

                if (obj === null || obj === undefined) {
                    return '""';
                }

                if (Array.isArray(obj)) {
                    return "[" + obj.map(function (item) {
                        return stableStringify(item);
                    }).join(",") + "]";
                }

                if (typeof obj === "object") {

                    return "{" +
                        Object.keys(obj)
                            .sort()
                            .map(function (key) {
                                return JSON.stringify(key) + ":" + stableStringify(obj[key]);
                            })
                            .join(",") +
                        "}";
                }

                return JSON.stringify(String(obj));
            }

            return stableStringify(a) === stableStringify(b);
        }

        $("#Loader").show();
        $("#Loader").css('display', 'flex');

        var xhr = ajaxHelper.ajaxGetJson('/PurchaseBill/GetDataForApi?code=' + code, function (data) {
            debugger;
            console.log("fbr_respone", data);
            try {
                if (data.msgType === 1) {

                    console.log('GetDataForApi Response', data.response);

                    var response = data.response;

                    // Remove trailing comma before } or ]
                    response = response.replace(/,\s*}/g, '}');
                    response = response.replace(/,\s*]/g, ']');

                    var fbrData;

                    try {
                        fbrData = JSON.parse(response);
                    } catch (e) {
                        console.error("JSON Parse Error:", e);
                        console.log("Response:", response);
                        return;
                    }

                    var displayText =
                        fbrData.invoiceNumber ||
                        fbrData.validationResponse?.error ||
                        fbrData.validationResponse?.invoiceStatuses
                            ?.map(function (item) {
                                return item.errorCode + ": " + item.error;
                            })
                            .filter(Boolean)
                            .join("<br>") ||
                        "Unknown response";

                    var statusUpdateRes =
                        empr_PurchaseBill.ApiStatus_Update(code, displayText);

                    $('#FBR_RES').val(displayText);

                    // Invoice Number valid hai to black, warna red
                    if (fbrData.invoiceNumber) {
                        $('#FBR_RES').css('color', 'black');
                    } else {
                        $('#FBR_RES').css('color', 'red');
                    }

                    if (data.qrCode) {
                        $("#qrImg").attr(
                            "src",
                            "data:image/png;base64," + data.qrCode
                        );
                        $('#BtnfBRpOST').hide();
                        $("#verifiedText").show();
                        $('#fbrVerifiedNote').css('display', 'inline-flex');
                        if ($('.pb-form').hasClass('pb-view-mode')) {
                            empr_PurchaseBill.ShowInvoiceView(code, true);
                        }
                    }
                }
                else {
                    empr_helper.notify("No data found / FBR error", 2);
                }
            } finally {
                $("#Loader").hide();
            }
        }, false, true);

        if (xhr && xhr.fail) {
            xhr.fail(function () {
                $("#Loader").hide();
            });
        }

    },
    ApiStatus_Update(code, apiResponce) {
        ajaxHelper.ajaxGetJson('/PurchaseBill/FBRApi_Status?code=' + code + '&apiResponce=' + apiResponce, function (data) {

        }, false, true);
    },

    ShowCostCenterModal: function (tranId, dtCode, desc, amt) {
        if (amt == null || amt === undefined || amt <= 0) {
            empr_helper.notify('Amount should be greater than zero.', 2);
            return;
        }

        var obj = {
            TranId: tranId,
            DtCode: dtCode,
            DESCR: desc,
            Amt: amt
        };

        $.ajax({
            url: 'CostCenter/Index',
            method: 'GET',
            data: obj,
            success: function (result) {
                $('#costCenterModalBody').html(result);
                $('#costCenterModal').modal('show');
            },
            error: function (error) {
            }
        });
    },

}