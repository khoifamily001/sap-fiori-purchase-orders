sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";

  function fmtEuro(n) {
    return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  function emptyCreate() {
    return {
      lieferant:"", kategorie:"", bestelldatum:"", lieferdatum:"",
      einkaeufer:"", prioritaet:"Mittel", zahlung:"Netto 30 Tage",
      lieferadresse:"", bemerkungen:"", gesamtbetrag:"0,00 €",
      positions:[{ mat:"", name:"", qty:0, unit:"Stk", price:0 }]
    };
  }

  return Controller.extend("purchaseorders.controller.Create", {

    onInit: function () {
      this.getView().setModel(new JSONModel(emptyCreate()), "create");
      // reset form each time the create route is opened
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("create").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function () {
      this.getView().getModel("create").setData(emptyCreate());
    },

    onCancel: function () {
      this.getOwnerComponent().getRouter().navTo("list");
    },

    onAddPosition: function () {
      var oModel = this.getView().getModel("create");
      var aPos = oModel.getProperty("/positions");
      aPos.push({ mat:"", name:"", qty:0, unit:"Stk", price:0 });
      oModel.setProperty("/positions", aPos);
    },

    onRemovePosition: function (oEvent) {
      var oModel = this.getView().getModel("create");
      var aPos = oModel.getProperty("/positions");
      var iIdx = parseInt(oEvent.getSource().getBindingContext("create").getPath().split("/").pop(), 10);
      aPos.splice(iIdx, 1);
      oModel.setProperty("/positions", aPos);
      this.onPositionChange();
    },

    onPositionChange: function () {
      var oModel = this.getView().getModel("create");
      var aPos = oModel.getProperty("/positions");
      var total = 0;
      aPos.forEach(function(p) {
        total += (parseFloat(p.qty) || 0) * (parseFloat(p.price) || 0);
      });
      oModel.setProperty("/gesamtbetrag", fmtEuro(total));
    },

    onSave: function () {
      var oData = this.getView().getModel("create").getData();

      if (!oData.lieferant || !oData.kategorie || !oData.bestelldatum ||
          !oData.lieferdatum || !oData.einkaeufer || !oData.lieferadresse) {
        MessageBox.error("Bitte alle Pflichtfelder ausfüllen.");
        return;
      }

      MessageToast.show("Bestellung wurde erstellt!");
      this.getOwnerComponent().getRouter().navTo("list");
    }

  });
});