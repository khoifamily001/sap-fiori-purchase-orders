sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
    "purchaseorders/controller/Create.controller"          
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox, CreateController) {
  "use strict";

  var STATUS_TEXT = {
    "01": "Version in Arbeit",   "02": "Aktiv",
    "03": "In Freigabe",         "04": "Freigabe teilweise",
    "05": "Freigabe abgeschlossen", "08": "Abgelehnt",
    "11": "In Verteilung",       "12": "Fehler bei Verteilung",
    "13": "Verteilt",            "14": "In Vorbereitung",
    "26": "In externer Genehmigung"
  };

  var STATUS_STATE = {
    "01": "None",    "02": "Success", "03": "Warning",
    "04": "Warning", "05": "Success", "08": "Error",
    "11": "Information", "12": "Error", "13": "Success",
    "14": "None",    "26": "Warning"
  };

  return Controller.extend("purchaseorders.controller.List", {

    onInit: function () {
      this._filterVisible = true;

      this._oCreateCtrl = new CreateController();
      this._oCreateCtrl.init(
        this.getView(),
        this.getOwnerComponent().getModel()
      );
    },

    onCreatePress: function () {
      this._oCreateCtrl.openDialog();     // all Create logic is in Create.controller.js
    },

    formatStatusText: function (sCode) { return STATUS_TEXT[sCode] || sCode || "–"; },
    formatStatusState: function (sCode) { return STATUS_STATE[sCode] || "None"; },

    formatAmount: function (sAmount, sCurrency) {
      if (!sAmount) { return "–"; }
      var fVal = parseFloat(sAmount);
      if (isNaN(fVal)) { return sAmount; }
      return fVal.toLocaleString("de-DE", {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }) + " " + (sCurrency || "");
    },

    onTableUpdateFinished: function (oEvent) {
      var iTotal  = oEvent.getParameter("total");
      var iActual = oEvent.getParameter("actual");
      this.byId("txtFilterCount").setText(iActual + " von " + iTotal + " Bestellungen");
    },

    onOrderPress: function (oEvent) {
      var sId = oEvent.getSource().getBindingContext().getProperty("PurchaseOrder");
      this.getOwnerComponent().getRouter().navTo("detail", { id: sId });
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
      var aFilters  = [];

      if (sSearch) {
        aFilters.push(new Filter({
          filters: [
            new Filter("PurchaseOrder", FilterOperator.Contains, sSearch),
            new Filter("Supplier",      FilterOperator.Contains, sSearch)
          ],
          and: false
        }));
      }
      if (sStatus)   { aFilters.push(new Filter("PurchasingProcessingStatus", FilterOperator.EQ, sStatus));   }
      if (sPurchOrg) { aFilters.push(new Filter("PurchasingOrganization",     FilterOperator.EQ, sPurchOrg)); }
      if (sCompany)  { aFilters.push(new Filter("CompanyCode",                FilterOperator.EQ, sCompany));  }

      this.byId("ordersTable").getBinding("items").filter(
        aFilters.length ? new Filter({ filters: aFilters, and: true }) : []
      );
    },

    onExportPress: function () {
      var aItems = this.byId("ordersTable").getItems();
      if (!aItems.length) { MessageToast.show("Keine Daten zum Exportieren."); return; }

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
});