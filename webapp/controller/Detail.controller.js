sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("purchaseorders.controller.Detail", {
      onInit: function () {
        this.getView().setModel(new JSONModel({ canAct: false }), "viewModel");

        var oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("detail")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched: function (oEvent) {
        var sId = oEvent.getParameter("arguments").id;
        var sPath = "/ZOSO_C_PurchaseOrder('" + sId + "')";

        this.getView().bindElement({
          path: sPath,
          events: {
            change: function () {
              var oCtx = this.getView().getBindingContext();
              if (!oCtx) {
                MessageToast.show("Bestellung nicht gefunden!");
                return;
              }

              var sStatus = oCtx.getProperty("PurchasingProcessingStatus");

              var bCanAct = sStatus === "02";

              this.getView()
                .getModel("viewModel")
                .setProperty("/canAct", bCanAct);
            }.bind(this),

            dataRequested: function () {
              // Reset buttons while loading
              this.getView()
                .getModel("viewModel")
                .setProperty("/canAct", false);
            }.bind(this),
          },
        });
      },

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo("list");
      },

      onApprove: function () {
        MessageBox.confirm(
          "Möchten Sie diese Bestellung wirklich genehmigen?",
          {
            title: "Genehmigen bestätigen",
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                this._updateStatus("approve");
              }
            }.bind(this),
          },
        );
      },

      onReject: function () {
        MessageBox.confirm("Möchten Sie diese Bestellung wirklich ablehnen?", {
          title: "Ablehnen bestätigen",
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              this._updateStatus("reject");
            }
          }.bind(this),
        });
      },

      _updateStatus: function (sAction) {
        var oView = this.getView();
        var sPO = oView.getBindingContext().getProperty("PurchaseOrder");

        var sTitle =
          sAction === "approve" ? "Genehmigung gesendet" : "Ablehnung gesendet";
        var sMsg =
          sAction === "approve"
            ? "Die Bestellung " +
              sPO +
              " wurde zur Genehmigung an das System übermittelt.\nSie wird in Kürze verarbeitet."
            : "Die Bestellung " +
              sPO +
              " wurde zur Ablehnung an das System übermittelt.\nSie wird in Kürze verarbeitet.";

        MessageBox.information(sMsg, {
          title: sTitle,
          icon:
            sAction === "approve"
              ? MessageBox.Icon.SUCCESS
              : MessageBox.Icon.WARNING,
          onClose: function () {
            // Disable buttons after action
            oView.getModel("viewModel").setProperty("/canAct", false);
          },
        });
      },
    });
  },
);
