sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";
  return Controller.extend("purchaseorders.controller.List", {

    onInit: function () {
      var oModel = new JSONModel({ orders: [
        { id:"PO-2026-00150", supplier:"Hoffmann Materials", cat:"Rohstoffe",          status:"Offen",          statusState:"Warning",     amount:"18.950,00 €", orderDate:"16.04.2026", delivDate:"10.05.2026", buyer:"Anna Schmidt",    priority:"Hoch",    positions:[{mat:"MAT-1001",name:"Stahl Blech 2mm",      qty:500,unit:"Stk", price:"20,00 €",   total:"10.000,00 €"},{mat:"MAT-1002",name:"Aluminium Profil",   qty:150,unit:"m",   price:"59,67 €",  total:"8.950,00 €"}]},
        { id:"PO-2026-00149", supplier:"Becker Supplies",    cat:"Büromaterial",        status:"Abgelehnt",      statusState:"Error",       amount:"3.280,00 €",  orderDate:"15.04.2026", delivDate:"22.04.2026", buyer:"Thomas Müller",  priority:"Niedrig", positions:[{mat:"MAT-2001",name:"Druckerpapier A4",   qty:100,unit:"Pack",price:"12,00 €",   total:"1.200,00 €"},{mat:"MAT-2002",name:"Toner Schwarz",      qty:20, unit:"Stk", price:"104,00 €", total:"2.080,00 €"}]},
        { id:"PO-2026-00148", supplier:"Fischer Industries",  cat:"Werkzeuge",           status:"Genehmigt",      statusState:"Success",     amount:"5.600,00 €",  orderDate:"14.04.2026", delivDate:"28.04.2026", buyer:"Sarah Weber",    priority:"Mittel",  positions:[{mat:"MAT-3001",name:"Bohrmaschine Profi",  qty:4,  unit:"Stk", price:"700,00 €",  total:"2.800,00 €"},{mat:"MAT-3002",name:"Schraubensatz",     qty:80, unit:"Set", price:"35,00 €",   total:"2.800,00 €"}]},
        { id:"PO-2026-00147", supplier:"Weber & Co.",         cat:"Ersatzteile",         status:"Offen",          statusState:"Warning",     amount:"22.340,80 €", orderDate:"13.04.2026", delivDate:"05.05.2026", buyer:"Michael Fischer",priority:"Hoch",    positions:[{mat:"MAT-4001",name:"Fahrradrahmen Carbon",qty:20, unit:"Stk", price:"850,00 €",  total:"17.000,00 €"},{mat:"MAT-4002",name:"Bremsscheibe 180mm",qty:120,unit:"Stk", price:"44,50 €",   total:"5.340,00 €"}]},
        { id:"PO-2026-00146", supplier:"Müller AG",           cat:"IT-Equipment",        status:"In Bearbeitung", statusState:"Information", amount:"8.750,00 €",  orderDate:"12.04.2026", delivDate:"20.04.2026", buyer:"Julia Becker",   priority:"Mittel",  positions:[{mat:"MAT-5001",name:"Laptop 15 Zoll",     qty:5,  unit:"Stk", price:"1.350,00 €",total:"6.750,00 €"},{mat:"MAT-5002",name:"Maus kabellos",     qty:10, unit:"Stk", price:"40,00 €",   total:"400,00 €"},{mat:"MAT-5003",name:"Tastatur DE",qty:10,unit:"Stk",price:"60,00 €",total:"600,00 €"}]},
        { id:"PO-2026-00145", supplier:"Schmidt GmbH",        cat:"Rohstoffe",           status:"Genehmigt",      statusState:"Success",     amount:"15.420,50 €", orderDate:"10.04.2026", delivDate:"25.04.2026", buyer:"Thomas Müller",  priority:"Mittel",  positions:[{mat:"MAT-1003",name:"Kupferdraht 1.5mm",   qty:200,unit:"kg",  price:"12,10 €",   total:"2.420,00 €"},{mat:"MAT-1004",name:"Gummiband industrie",qty:300,unit:"Pack",price:"43,34 €",  total:"13.000,00 €"}]},
        { id:"PO-2026-00151", supplier:"Koch Trading",        cat:"Verpackungsmaterial", status:"Abgeschlossen",  statusState:"None",        amount:"12.780,00 €", orderDate:"11.04.2026", delivDate:"18.04.2026", buyer:"Anna Schmidt",   priority:"Niedrig", positions:[{mat:"MAT-6001",name:"Kartons 60x40x30",   qty:600,unit:"Stk", price:"1,80 €",    total:"1.080,00 €"},{mat:"MAT-6002",name:"Luftpolsterfolie",  qty:50, unit:"Rolle",price:"233,00 €", total:"11.650,00 €"}]},
        { id:"PO-2026-00152", supplier:"Bauer Logistics",     cat:"Büromaterial",        status:"Abgeschlossen",  statusState:"None",        amount:"6.450,00 €",  orderDate:"09.04.2026", delivDate:"19.04.2026", buyer:"Sarah Weber",    priority:"Niedrig", positions:[{mat:"MAT-2003",name:"Ordner A4",           qty:150,unit:"Stk", price:"8,00 €",    total:"1.200,00 €"},{mat:"MAT-2004",name:"Heftklammern",      qty:100,unit:"Box", price:"52,50 €",   total:"5.250,00 €"}]}
      ]});
      this.getView().setModel(oModel);
      this.getView().setModel(new JSONModel({ canAct: false }), "detail");
    },

    onSearch: function (oEvent) {
      var sQuery = oEvent.getParameter("query").toLowerCase();
      var aAll = this.getView().getModel().getProperty("/orders");
      this.getView().getModel().setProperty("/orders",
        sQuery ? aAll.filter(function(o){
          return o.id.toLowerCase().includes(sQuery) ||
                 o.supplier.toLowerCase().includes(sQuery);
        }) : aAll);
    },

    onOrderPress: function (oEvent) {
      var oOrder = oEvent.getSource().getBindingContext().getObject();
      var oDetail = Object.assign({}, oOrder);
      oDetail.canAct = (oOrder.status === "Offen" || oOrder.status === "In Bearbeitung");
      this.getView().getModel("detail").setData(oDetail);
      this.byId("mainApp").to(this.byId("detailPage"));
    },

    onNavBack: function () {
      this.byId("mainApp").back();
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
      var oModel  = this.getView().getModel();
      var aOrders = oModel.getProperty("/orders");
      var iIdx    = aOrders.findIndex(function(o){ return o.id === sId; });
      if (iIdx > -1) {
        oModel.setProperty("/orders/" + iIdx + "/status",      sStatus);
        oModel.setProperty("/orders/" + iIdx + "/statusState", sState);
      }
    }
  });
});