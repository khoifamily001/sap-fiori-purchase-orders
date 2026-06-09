sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
  ],
  function (Controller, Filter, FilterOperator, JSONModel, MessageToast, MessageBox) {
    "use strict";

    var STATUS_TEXT = {
      "01": "Version in Arbeit", "02": "Aktiv", "03": "In Freigabe",
      "04": "Freigabe teilweise", "05": "Freigabe abgeschlossen", "08": "Abgelehnt",
      11: "In Verteilung", 12: "Fehler bei Verteilung", 13: "Verteilt",
      14: "In Vorbereitung", 26: "In externer Genehmigung"
    };

    var STATUS_STATE = {
      "01": "None", "02": "Success", "03": "Warning", "04": "Warning",
      "05": "Success", "08": "Error", 11: "Information", 12: "Error",
      13: "Success", 14: "None", 26: "Warning"
    };

    function fmtEuro(n) {
      return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
    }

    function emptyCreate() {
      return {
        lieferant: "", kategorie: "", bestelldatum: "", lieferdatum: "",
        einkaeufer: "", prioritaet: "Mittel", zahlung: "Netto 30 Tage",
        lieferadresse: "", bemerkungen: "", gesamtbetrag: "0,00 €",
        positions: [{ mat: "", name: "", qty: 0, unit: "Stk", price: 0 }]
      };
    }

    return Controller.extend("purchaseorders.controller.List", {

      onInit: function () {
        this._filterVisible = true;
        this.getView().setModel(new JSONModel(emptyCreate()), "create");
      },

      formatStatusText:  function (sCode) { return STATUS_TEXT[sCode]  || sCode || "–"; },
      formatStatusState: function (sCode) { return STATUS_STATE[sCode] || "None"; },

      formatAmount: function (sAmount, sCurrency) {
        if (!sAmount) return "–";
        var fVal = parseFloat(sAmount);
        if (isNaN(fVal)) return sAmount;
        return fVal.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          + " " + (sCurrency || "");
      },

      onTableUpdateFinished: function (oEvent) {
        var iTotal  = oEvent.getParameter("total");
        var iActual = oEvent.getParameter("actual");
        this.byId("txtFilterCount").setText(iActual + " von " + iTotal + " Bestellungen");
      },

      onToggleFilter: function () {
        this._filterVisible = !this._filterVisible;
        this.byId("filterPanel").setVisible(this._filterVisible);
        this.byId("btnToggleFilter").setText(
          this._filterVisible ? "Filter ausblenden" : "Filter einblenden"
        );
      },

      onLiveSearch: function () { this._applyFilters(); },
      onSearch:     function () { this._applyFilters(); },
      onFilter:     function () { this._applyFilters(); },

      _applyFilters: function () {
        var sSearch   = this.byId("searchField").getValue().trim();
        var sStatus   = this.byId("filterStatus").getSelectedKey();
        var sPurchOrg = this.byId("filterPurchOrg").getSelectedKey();
        var sCompany  = this.byId("filterCompany").getSelectedKey();

        var aFilters = [];

        if (sSearch) {
          aFilters.push(new Filter({
            filters: [
              new Filter("PurchaseOrder", FilterOperator.Contains, sSearch),
              new Filter("Supplier",      FilterOperator.Contains, sSearch),
            ],
            and: false
          }));
        }
        if (sStatus)   aFilters.push(new Filter("PurchasingProcessingStatus", FilterOperator.EQ, sStatus));
        if (sPurchOrg) aFilters.push(new Filter("PurchasingOrganization",     FilterOperator.EQ, sPurchOrg));
        if (sCompany)  aFilters.push(new Filter("CompanyCode",                FilterOperator.EQ, sCompany));

        this.byId("ordersTable").getBinding("items").filter(
          aFilters.length ? new Filter({ filters: aFilters, and: true }) : []
        );
      },

      onOrderPress: function (oEvent) {
        var sId = oEvent.getSource().getBindingContext().getProperty("PurchaseOrder");
        this.getOwnerComponent().getRouter().navTo("detail", { id: sId });
      },

      // CREATE DIALOG handlers
      onCreatePress: function () {
        this.getView().getModel("create").setData(emptyCreate());
        this.byId("createDialog").open();
      },

      onCancelCreate: function () {
        this.byId("createDialog").close();
      },

      onAddPosition: function () {
        var oModel = this.getView().getModel("create");
        var aPos = oModel.getProperty("/positions");
        aPos.push({ mat: "", name: "", qty: 0, unit: "Stk", price: 0 });
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

      onSaveCreate: function () {
        var oData = this.getView().getModel("create").getData();

        if (!oData.lieferant || !oData.kategorie || !oData.bestelldatum ||
            !oData.lieferdatum || !oData.einkaeufer || !oData.lieferadresse) {
          MessageBox.error("Bitte alle Pflichtfelder ausfüllen.");
          return;
        }

        MessageToast.show("Bestellung wurde erfolgreich erstellt!");
        this.byId("createDialog").close();
      },

      onExportPress: function () {
        var aItems = this.byId("ordersTable").getItems();
        if (!aItems.length) {
          MessageToast.show("Keine Daten zum Exportieren.");
          return;
        }
        var sCSV = "Bestellnummer,Lieferant,Status,Einkaufsorg.,Buchungskreis,Währung,Gesamtbetrag\n";
        aItems.forEach(function (oItem) {
          var o = oItem.getBindingContext();
          sCSV += [
            o.getProperty("PurchaseOrder"),
            o.getProperty("Supplier"),
            STATUS_TEXT[o.getProperty("PurchasingProcessingStatus")] || o.getProperty("PurchasingProcessingStatus"),
            o.getProperty("PurchasingOrganization"),
            o.getProperty("CompanyCode"),
            o.getProperty("DocumentCurrency"),
            o.getProperty("PurgReleaseTimeTotalAmount")
          ].join(",") + "\n";
        });
        var oLink = document.createElement("a");
        oLink.href = URL.createObjectURL(new Blob([sCSV], { type: "text/csv;charset=utf-8;" }));
        oLink.download = "bestellungen.csv";
        oLink.click();
        MessageToast.show("Export erfolgreich!");
      }

    });
  }
);