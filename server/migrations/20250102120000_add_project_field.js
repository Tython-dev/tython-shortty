const { onUpdateTrigger } = require("../utils");

exports.up = function(knex) {
  return knex.schema.alterTable("links", table => {
    table.string("project").nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("links", table => {
    table.dropColumn("project");
  });
};
