sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("purchaseorders.controller.Detail", {

    onInit: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var sId = oEvent.getParameter("arguments").id;

      // Get the order from the List model
      var oListModel = this.getOwnerComponent().getModel("orders");
      var aOrders = oListModel.getProperty("/orders");
      var oOrder = aOrders.find(function(o) { return o.id === sId; });

      if (!oOrder) {
        MessageToast.show("Bestellung nicht gefunden!");
        return;
      }

      // Set view model
      var oViewModel = new JSONModel({
        selectedOrder: oOrder,
        canAct: oOrder.status === "Offen" || oOrder.status === "In Bearbeitung"
      });
      this.getView().setModel(oViewModel, "viewModel");
    },

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("list");
    },

    onApprove: function () {
      MessageBox.confirm("Möchten Sie diese Bestellung wirklich genehmigen?", {
        title: "Genehmigen bestätigen",
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) {
            this._updateStatus("Genehmigt", "Success");
            MessageToast.show("✅ Bestellung wurde genehmigt!");
          }
        }.bind(this)
      });
    },

    onReject: function () {
      MessageBox.confirm("Möchten Sie diese Bestellung wirklich ablehnen?", {
        title: "Ablehnen bestätigen",
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) {
            this._updateStatus("Abgelehnt", "Error");
            MessageToast.show("❌ Bestellung wurde abgelehnt!");
          }
        }.bind(this)
      });
    },

    _updateStatus: function (sStatus, sState) {
      var oViewModel = this.getView().getModel("viewModel");

      // Update detail view
      oViewModel.setProperty("/selectedOrder/status", sStatus);
      oViewModel.setProperty("/selectedOrder/statusState", sState);
      oViewModel.setProperty("/canAct", false);

      // Update the list model too so it reflects when going back
      var sId = oViewModel.getProperty("/selectedOrder/id");
      var oListModel = this.getOwnerComponent().getModel("orders");
      var aOrders = oListModel.getProperty("/orders");
      var iIndex = aOrders.findIndex(function(o) { return o.id === sId; });
      if (iIndex > -1) {
        oListModel.setProperty("/orders/" + iIndex + "/status", sStatus);
        oListModel.setProperty("/orders/" + iIndex + "/statusState", sState);
      }
    }

  });
});