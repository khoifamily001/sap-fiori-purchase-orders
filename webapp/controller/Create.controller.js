sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment) {
  "use strict";

  function fmtEuro(n) {
    return n.toLocaleString("de-DE", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) + " €";
  }

  function emptyCreate() {
    return {
      lieferant: "", kategorie: "", bestelldatum: "", lieferdatum: "",
      einkaeufer: "", prioritaet: "Mittel", zahlung: "Netto 30 Tage",
      lieferadresse: "", bemerkungen: "", gesamtbetrag: "0,00 €",
      positions: [{ mat: "", name: "", qty: 0, unit: "", price: 0 }]
    };
  }

  function generateFakePONumber() {
    return String(4500002416 + Math.floor(Math.random() * 9999));
  }

  return Controller.extend("purchaseorders.controller.Create", {

    init: function (oView, oODataModel) {
      this._oView = oView;
      this._oDialog = null;

      oView.setModel(new JSONModel(emptyCreate()), "create");
      oView.setModel(new JSONModel([{ key: "", text: "Wird geladen..." }]), "suppliers");
      oView.setModel(new JSONModel([
        { key: "", text: "Bitte wählen..." },
        { key: "Stk", text: "Stk" },
        { key: "kg", text: "kg" },
        { key: "m", text: "m" },
        { key: "Pack", text: "Pack" },
        { key: "Set", text: "Set" }
      ]), "units");

      oODataModel.metadataLoaded().then(function () {
        this._loadSuppliers(oODataModel);
        this._loadUnits(oODataModel);
      }.bind(this));
    },

    openDialog: function () {
      this._oView.getModel("create").setData(emptyCreate());

      var oLieferPicker = Fragment.byId(this._oView.getId(), "cLieferdatum");
      if (oLieferPicker) {
        oLieferPicker.setValueState("None");
        oLieferPicker.setValueStateText("");
        oLieferPicker.setMinDate(null);
      }

      if (this._oDialog) {
        this._oDialog.open();
        return;
      }

      Fragment.load({
        id: this._oView.getId(),
        name: "purchaseorders.view.Create",
        controller: this
      }).then(function (oDialog) {
        this._oView.addDependent(oDialog);
        this._oDialog = oDialog;
        oDialog.open();
      }.bind(this)).catch(function (oError) {
        MessageBox.error("Fragment konnte nicht geladen werden:\n" + oError.message);
        console.error(oError);
      });
    },

    onCancelCreate: function () {
      if (this._oDialog) { this._oDialog.close(); }
    },

    onAddPosition: function () {
      var oModel = this._oView.getModel("create");
      var aPos = oModel.getProperty("/positions");
      aPos.push({ mat: "", name: "", qty: 0, unit: "", price: 0 });
      oModel.setProperty("/positions", aPos);
    },

    onDateChange: function () {
      var oModel = this._oView.getModel("create");
      var sBestelldatum = oModel.getProperty("/bestelldatum");
      var sLieferdatum = oModel.getProperty("/lieferdatum");

      var oLieferPicker = Fragment.byId(this._oView.getId(), "cLieferdatum");
      if (!oLieferPicker) { return; }

      var fnParse = function (s) {
        var p = s.split(".");
        return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
      };

      if (sBestelldatum) {
        var oMin = fnParse(sBestelldatum);
        if (!isNaN(oMin.getTime())) {
          oLieferPicker.setMinDate(oMin);
        }
      }

      if (!sBestelldatum || !sLieferdatum) {
        oLieferPicker.setValueState("None");
        return;
      }

      var oBestellDate = fnParse(sBestelldatum);
      var oLieferDate = fnParse(sLieferdatum);

      if (isNaN(oBestellDate.getTime()) || isNaN(oLieferDate.getTime())) {
        oLieferPicker.setValueState("None");
        return;
      }

      if (oLieferDate < oBestellDate) {
        oLieferPicker.setValueState("Error");
        oLieferPicker.setValueStateText(
          "Lieferdatum darf nicht vor dem Bestelldatum liegen."
        );
      } else {
        oLieferPicker.setValueState("None");
        oLieferPicker.setValueStateText("");
      }
    },

    onRemovePosition: function (oEvent) {
      var oModel = this._oView.getModel("create");
      var aPos = oModel.getProperty("/positions");
      var iIdx = parseInt(
        oEvent.getSource().getBindingContext("create").getPath().split("/").pop(), 10
      );
      aPos.splice(iIdx, 1);
      oModel.setProperty("/positions", aPos);
      this.onPositionChange();   
    },

    onPositionChange: function (oEvent) {
      var oModel = this._oView.getModel("create");

      if (oEvent && oEvent.getSource) {
        var oSource = oEvent.getSource();
        var sNewVal = oEvent.getParameter("newValue");
        var oCtx = oSource.getBindingContext("create");
        if (oCtx && sNewVal !== undefined) {
          var sField = oSource.getBinding("value").getPath();
          oModel.setProperty(oCtx.getPath() + "/" + sField, sNewVal);
        }
      }

      var aPos = oModel.getProperty("/positions");
      var total = 0;
      aPos.forEach(function (p) {
        total += (parseFloat(p.qty) || 0) * (parseFloat(p.price) || 0);
      });
      oModel.setProperty("/gesamtbetrag", fmtEuro(total));
    },

    onSaveCreate: function () {
      var oData = this._oView.getModel("create").getData();

      if (!oData.lieferant || !oData.kategorie || !oData.bestelldatum ||
        !oData.lieferdatum || !oData.einkaeufer || !oData.lieferadresse) {
        MessageBox.error("Bitte alle Pflichtfelder ausfüllen.");
        return;
      }

      var fnParse = function (s) {
        var p = s.split(".");
        return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
      };

      if (fnParse(oData.lieferdatum) < fnParse(oData.bestelldatum)) {
        MessageBox.error("Lieferdatum darf nicht vor dem Bestelldatum liegen.");
        return;
      }

      if (this._oDialog) { this._oDialog.close(); }

      MessageBox.success(
        "Die Bestellung wurde erfolgreich angelegt.\n\nBestellnummer: " + generateFakePONumber(),
        { title: "Bestellung erstellt" }
      );
    },

    _loadSuppliers: function (oModel) {
      oModel.read("/ZOSO_C_PurchaseOrder", {
        urlParameters: { "$select": "Supplier", "$top": "500" },
        success: function (oData) {
          var oSeen = {};
          var aList = [{ key: "", text: "Bitte wählen..." }];
          oData.results.forEach(function (item) {
            if (item.Supplier && !oSeen[item.Supplier]) {
              oSeen[item.Supplier] = true;
              aList.push({ key: item.Supplier, text: item.Supplier });
            }
          });
          aList.sort(function (a, b) {
            if (!a.key) { return -1; }
            if (!b.key) { return 1; }
            return a.key.localeCompare(b.key);
          });
          this._oView.getModel("suppliers").setData(aList);
        }.bind(this),
        error: function () {
          this._oView.getModel("suppliers").setData([{ key: "", text: "Bitte wählen..." }]);
          MessageToast.show("Lieferanten konnten nicht geladen werden.");
        }.bind(this)
      });
    },

    _loadUnits: function (oModel) {
      oModel.read("/SAP__UnitsOfMeasure", {
        urlParameters: { "$select": "UnitCode,ExternalCode,Text" },
        success: function (oData) {
          var aList = [{ key: "", text: "Bitte wählen..." }];
          oData.results.forEach(function (item) {
            var sDisplay = (item.ExternalCode && item.ExternalCode.trim())
              ? item.ExternalCode.trim() : item.UnitCode;
            if (item.UnitCode && sDisplay) {
              aList.push({ key: item.UnitCode, text: sDisplay });
            }
          });
          this._oView.getModel("units").setData(aList);
        }.bind(this),
        error: function () {
          MessageToast.show("Einheiten konnten nicht geladen werden.");
        }.bind(this)
      });
    }

  });
});