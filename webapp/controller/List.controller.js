sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
  "use strict";

  return Controller.extend("purchaseorders.controller.List", {

    onInit: function () {
      // Nothing needed here anymore — no detail model on this view
    },

    onSearch: function (oEvent) {
      var sQuery = oEvent.getParameter("query");
      var oBinding = this.byId("ordersTable").getBinding("items");
      var aFilters = [];
      if (sQuery && sQuery.trim().length > 0) {
        aFilters.push(new Filter({
          filters: [
            new Filter("PurchaseOrder", FilterOperator.Contains, sQuery),
            new Filter("Supplier",      FilterOperator.Contains, sQuery)
          ],
          and: false
        }));
      }
      oBinding.filter(aFilters);
    },

    onOrderPress: function (oEvent) {
      // Read the PurchaseOrder key from the OData binding context
      var sId = oEvent.getSource()
                      .getBindingContext()
                      .getProperty("PurchaseOrder");

      // Navigate via router — Detail controller picks it up
      this.getOwnerComponent().getRouter().navTo("detail", { id: sId });
    }

  });
});