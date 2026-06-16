QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
  sap.ui.require([
    "purchaseorders/test/unit/controller/Detail.controller.test",
    "purchaseorders/test/unit/controller/List.controller.test",
    "purchaseorders/test/unit/controller/Create.controller.test"
  ], function () {
    QUnit.start();
  });
});
