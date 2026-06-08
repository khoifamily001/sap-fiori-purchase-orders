sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";

  var ALL_ORDERS = [
    { id:"PO-2026-00150", supplier:"Hoffmann Materials", cat:"Rohstoffe",          status:"Offen",          statusState:"Warning",     amount:"18.950,00 €", orderDate:"16.04.2026", delivDate:"10.05.2026", buyer:"Anna Schmidt",    priority:"Hoch",    positions:[{mat:"MAT-1001",name:"Stahl Blech 2mm",      qty:500,unit:"Stk", price:"20,00 €",   total:"10.000,00 €"},{mat:"MAT-1002",name:"Aluminium Profil",   qty:150,unit:"m",   price:"59,67 €",  total:"8.950,00 €"}]},
    { id:"PO-2026-00149", supplier:"Becker Supplies",    cat:"Büromaterial",        status:"Abgelehnt",      statusState:"Error",       amount:"3.280,00 €",  orderDate:"15.04.2026", delivDate:"22.04.2026", buyer:"Thomas Müller",  priority:"Niedrig", positions:[{mat:"MAT-2001",name:"Druckerpapier A4",   qty:100,unit:"Pack",price:"12,00 €",   total:"1.200,00 €"},{mat:"MAT-2002",name:"Toner Schwarz",      qty:20, unit:"Stk", price:"104,00 €", total:"2.080,00 €"}]},
    { id:"PO-2026-00148", supplier:"Fischer Industries",  cat:"Werkzeuge",           status:"Genehmigt",      statusState:"Success",     amount:"5.600,00 €",  orderDate:"14.04.2026", delivDate:"28.04.2026", buyer:"Sarah Weber",    priority:"Mittel",  positions:[{mat:"MAT-3001",name:"Bohrmaschine Profi",  qty:4,  unit:"Stk", price:"700,00 €",  total:"2.800,00 €"},{mat:"MAT-3002",name:"Schraubensatz",     qty:80, unit:"Set", price:"35,00 €",   total:"2.800,00 €"}]},
    { id:"PO-2026-00147", supplier:"Weber & Co.",         cat:"Ersatzteile",         status:"Offen",          statusState:"Warning",     amount:"22.340,80 €", orderDate:"13.04.2026", delivDate:"05.05.2026", buyer:"Michael Fischer",priority:"Hoch",    positions:[{mat:"MAT-4001",name:"Fahrradrahmen Carbon",qty:20, unit:"Stk", price:"850,00 €",  total:"17.000,00 €"},{mat:"MAT-4002",name:"Bremsscheibe 180mm",qty:120,unit:"Stk", price:"44,50 €",   total:"5.340,00 €"}]},
    { id:"PO-2026-00146", supplier:"Müller AG",           cat:"IT-Equipment",        status:"In Bearbeitung", statusState:"Information", amount:"8.750,00 €",  orderDate:"12.04.2026", delivDate:"20.04.2026", buyer:"Julia Becker",   priority:"Mittel",  positions:[{mat:"MAT-5001",name:"Laptop 15 Zoll",     qty:5,  unit:"Stk", price:"1.350,00 €",total:"6.750,00 €"},{mat:"MAT-5002",name:"Maus kabellos",     qty:10, unit:"Stk", price:"40,00 €",   total:"400,00 €"},{mat:"MAT-5003",name:"Tastatur DE",qty:10,unit:"Stk",price:"60,00 €",total:"600,00 €"}]},
    { id:"PO-2026-00145", supplier:"Schmidt GmbH",        cat:"Rohstoffe",           status:"Genehmigt",      statusState:"Success",     amount:"15.420,50 €", orderDate:"10.04.2026", delivDate:"25.04.2026", buyer:"Thomas Müller",  priority:"Mittel",  positions:[{mat:"MAT-1003",name:"Kupferdraht 1.5mm",   qty:200,unit:"kg",  price:"12,10 €",   total:"2.420,00 €"},{mat:"MAT-1004",name:"Gummiband industrie",qty:300,unit:"Pack",price:"43,34 €",  total:"13.000,00 €"}]},
    { id:"PO-2026-00151", supplier:"Koch Trading",        cat:"Verpackungsmaterial", status:"Abgeschlossen",  statusState:"None",        amount:"12.780,00 €", orderDate:"11.04.2026", delivDate:"18.04.2026", buyer:"Anna Schmidt",   priority:"Niedrig", positions:[{mat:"MAT-6001",name:"Kartons 60x40x30",   qty:600,unit:"Stk", price:"1,80 €",    total:"1.080,00 €"},{mat:"MAT-6002",name:"Luftpolsterfolie",  qty:50, unit:"Rolle",price:"233,00 €", total:"11.650,00 €"}]},
    { id:"PO-2026-00152", supplier:"Bauer Logistics",     cat:"Büromaterial",        status:"Abgeschlossen",  statusState:"None",        amount:"6.450,00 €",  orderDate:"09.04.2026", delivDate:"19.04.2026", buyer:"Sarah Weber",    priority:"Niedrig", positions:[{mat:"MAT-2003",name:"Ordner A4",           qty:150,unit:"Stk", price:"8,00 €",    total:"1.200,00 €"},{mat:"MAT-2004",name:"Heftklammern",      qty:100,unit:"Box", price:"52,50 €",   total:"5.250,00 €"}]}
  ];

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

  return Controller.extend("purchaseorders.controller.List", {

    onInit: function () {
      this._allOrders = JSON.parse(JSON.stringify(ALL_ORDERS));
      this.getView().setModel(new JSONModel({ orders: this._allOrders }));
      this.getView().setModel(new JSONModel({ canAct: false }), "detail");
      this.getView().setModel(new JSONModel(emptyCreate()), "create");
      this._filterVisible = true;
      this._updateCount(this._allOrders.length, this._allOrders.length);
    },

    _updateCount: function(filtered, total) {
      this.byId("txtFilterCount").setText(filtered + " von " + total + " Bestellungen");
    },

    onToggleFilter: function () {
      this._filterVisible = !this._filterVisible;
      this.byId("filterPanel").setVisible(this._filterVisible);
      this.byId("btnToggleFilter").setText(this._filterVisible ? "Filter ausblenden" : "Filter einblenden");
    },

    onLiveSearch: function () { this._applyFilters(); },
    onSearch:     function () { this._applyFilters(); },
    onFilter:     function () { this._applyFilters(); },

    _applyFilters: function () {
      var sSearch = this.byId("searchField").getValue().toLowerCase();
      var sStatus = this.byId("filterStatus").getSelectedKey();
      var sKat    = this.byId("filterKategorie").getSelectedKey();
      var sLief   = this.byId("filterLieferant").getSelectedKey();
      var sEink   = this.byId("filterEinkaeufer").getSelectedKey();

      var aFiltered = this._allOrders.filter(function(o) {
        if (sSearch && !o.id.toLowerCase().includes(sSearch) &&
            !o.supplier.toLowerCase().includes(sSearch)) return false;
        if (sStatus && o.status   !== sStatus) return false;
        if (sKat    && o.cat      !== sKat)    return false;
        if (sLief   && o.supplier !== sLief)   return false;
        if (sEink   && o.buyer    !== sEink)   return false;
        return true;
      });
      this.getView().getModel().setProperty("/orders", aFiltered);
      this._updateCount(aFiltered.length, this._allOrders.length);
    },

    onOrderPress: function (oEvent) {
      var oOrder  = oEvent.getSource().getBindingContext().getObject();
      var oDetail = Object.assign({}, oOrder);
      oDetail.canAct = (oOrder.status === "Offen" || oOrder.status === "In Bearbeitung");
      this.getView().getModel("detail").setData(oDetail);
      this.byId("mainApp").to(this.byId("detailPage"));
    },

    onNavBack: function () {
      this.byId("mainApp").back();
    },

    onCreatePress: function () {
      this.getView().getModel("create").setData(emptyCreate());
      this.byId("mainApp").to(this.byId("createPage"));
    },

    onCancelCreate: function () {
      this.byId("mainApp").back();
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

    onSaveCreate: function () {
      var oData = this.getView().getModel("create").getData();

      if (!oData.lieferant || !oData.kategorie || !oData.bestelldatum ||
          !oData.lieferdatum || !oData.einkaeufer || !oData.lieferadresse) {
        MessageBox.error("Bitte alle Pflichtfelder ausfüllen.");
        return;
      }

      var total = 0;
      var aPositions = oData.positions.map(function(p) {
        var lineTotal = (parseFloat(p.qty) || 0) * (parseFloat(p.price) || 0);
        total += lineTotal;
        return {
          mat: p.mat || "MAT-NEU", name: p.name || "Artikel",
          qty: p.qty, unit: p.unit,
          price: fmtEuro(parseFloat(p.price) || 0),
          total: fmtEuro(lineTotal)
        };
      });

      var oNew = {
        id: "PO-2026-00" + (200 + this._allOrders.length),
        supplier: oData.lieferant, cat: oData.kategorie,
        status: "Offen", statusState: "Warning",
        amount: fmtEuro(total),
        orderDate: oData.bestelldatum, delivDate: oData.lieferdatum,
        buyer: oData.einkaeufer, priority: oData.prioritaet,
        positions: aPositions
      };

      this._allOrders.unshift(oNew);
      this.getView().getModel().setProperty("/orders", this._allOrders);
      this._updateCount(this._allOrders.length, this._allOrders.length);
      MessageToast.show("Bestellung " + oNew.id + " wurde erstellt!");
      this.byId("mainApp").back();
    },

    onDeletePress: function () {
      var aSelected = this.byId("ordersTable").getSelectedItems();
      if (!aSelected.length) {
        MessageToast.show("Bitte mindestens eine Bestellung auswählen.");
        return;
      }
      MessageBox.confirm("Möchten Sie " + aSelected.length + " Bestellung(en) löschen?", {
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) {
            var aIds = aSelected.map(function(item) {
              return item.getBindingContext().getProperty("id");
            });
            this._allOrders = this._allOrders.filter(function(o) {
              return !aIds.includes(o.id);
            });
            this.getView().getModel().setProperty("/orders", this._allOrders);
            this._updateCount(this._allOrders.length, this._allOrders.length);
            MessageToast.show(aIds.length + " Bestellung(en) gelöscht.");
          }
        }.bind(this)
      });
    },

    onExportPress: function () {
      var aOrders = this.getView().getModel().getProperty("/orders");
      var sCSV = "Bestellnummer,Lieferant,Bestelldatum,Lieferdatum,Status,Betrag\n";
      aOrders.forEach(function(o) {
        sCSV += [o.id, o.supplier, o.orderDate, o.delivDate, o.status, o.amount].join(",") + "\n";
      });
      var oBlob = new Blob([sCSV], { type: "text/csv" });
      var oLink = document.createElement("a");
      oLink.href = URL.createObjectURL(oBlob);
      oLink.download = "bestellungen.csv";
      oLink.click();
      MessageToast.show("Export erfolgreich!");
    },

    onApprove: function () {
      MessageBox.confirm("Möchten Sie diese Bestellung wirklich genehmigen?", {
        title: "Genehmigen bestätigen",
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) {
            this._updateStatus("Genehmigt", "Success");
            MessageToast.show("Bestellung wurde genehmigt!");
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
            MessageToast.show("Bestellung wurde abgelehnt!");
          }
        }.bind(this)
      });
    },

    _updateStatus: function (sStatus, sState) {
      var oDetail = this.getView().getModel("detail");
      var sId = oDetail.getProperty("/id");
      oDetail.setProperty("/status",      sStatus);
      oDetail.setProperty("/statusState", sState);
      oDetail.setProperty("/canAct",      false);
      var iIdx = this._allOrders.findIndex(function(o) { return o.id === sId; });
      if (iIdx > -1) {
        this._allOrders[iIdx].status      = sStatus;
        this._allOrders[iIdx].statusState = sState;
      }
      this.getView().getModel().setProperty("/orders", this._allOrders);
    }

  });
});