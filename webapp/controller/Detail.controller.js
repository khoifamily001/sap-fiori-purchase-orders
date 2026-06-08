sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("purchaseorders.controller.Detail", {

    onInit: function () {
      this.getView().setModel(new JSONModel({ canAct: false }), "viewModel");
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var sId   = oEvent.getParameter("arguments").id;
      var sPath = "/ZOSO_C_PurchaseOrder('" + sId + "')";

      this.getView().getModel("viewModel").setProperty("/canAct", false);

      this.getView().bindElement({
        path: sPath,
        parameters: {
          select: [
            "PurchaseOrder", "PurchaseOrderType", "Supplier",
            "PurchasingProcessingStatus", "PurchaseOrderDate", "CreationDate",
            "CreatedByUser", "PurgReleaseTimeTotalAmount", "DocumentCurrency",
            "CompanyCode", "PurchasingOrganization", "PurchasingGroup",
            "PaymentTerms", "CashDiscount1Days"
          ].join(",")
        },
        events: {
          change: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) {
              MessageToast.show("Bestellung nicht gefunden!");
              return;
            }
            var sStatus = oCtx.getProperty("PurchasingProcessingStatus");
            this.getView().getModel("viewModel").setProperty("/canAct", sStatus === "02");
          }.bind(this),
          dataRequested: function () {
            this.getView().getModel("viewModel").setProperty("/canAct", false);
          }.bind(this)
        }
      });
    },

    formatStatusText: function (sCode) {
      var m = { "01":"Erstellt", "02":"Zur Genehmigung", "03":"Genehmigt", "04":"Abgelehnt", "05":"Abgeschlossen" };
      return m[sCode] || sCode || "–";
    },

    formatStatusState: function (sCode) {
      var m = { "01":"None", "02":"Warning", "03":"Success", "04":"Error", "05":"None" };
      return m[sCode] || "None";
    },

    formatAmount: function (sAmount, sCurrency) {
      if (!sAmount) { return "–"; }
      var fVal = parseFloat(sAmount);
      if (isNaN(fVal)) { return sAmount; }
      return fVal.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
             + " " + (sCurrency || "");
    },

    formatDate: function (oDate) {
      if (!oDate) { return "–"; }
      try {
        var d = (oDate instanceof Date) ? oDate : new Date(oDate);
        return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      } catch (e) { return "–"; }
    },

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("list");
    },

    onApprove: function () {
      MessageBox.confirm("Möchten Sie diese Bestellung wirklich genehmigen?", {
        title: "Genehmigen bestätigen",
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) { this._updateStatus("approve"); }
        }.bind(this)
      });
    },

    onReject: function () {
      MessageBox.confirm("Möchten Sie diese Bestellung wirklich ablehnen?", {
        title: "Ablehnen bestätigen",
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) { this._updateStatus("reject"); }
        }.bind(this)
      });
    },

    _updateStatus: function (sAction) {
      var oView = this.getView();
      var sPO   = oView.getBindingContext().getProperty("PurchaseOrder");
      var sTitle = sAction === "approve" ? "Genehmigung gesendet" : "Ablehnung gesendet";
      var sMsg   = sAction === "approve"
        ? "Die Bestellung " + sPO + " wurde zur Genehmigung an das System übermittelt.\nSie wird in Kürze verarbeitet."
        : "Die Bestellung " + sPO + " wurde zur Ablehnung an das System übermittelt.\nSie wird in Kürze verarbeitet.";

      MessageBox.information(sMsg, {
        title: sTitle,
        icon: sAction === "approve" ? MessageBox.Icon.SUCCESS : MessageBox.Icon.WARNING,
        onClose: function () {
          oView.getModel("viewModel").setProperty("/canAct", false);
        }
      });
    }

  });
});