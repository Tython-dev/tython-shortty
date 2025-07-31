const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

const sqlitePath = path.join(__dirname, 'db', 'data');
const sqlite = new Database(sqlitePath);

const pgClient = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'Shortty',
  password: 'nizar2003',
  port: 5432,
});

async function migrateTables() {
  try {
    await pgClient.connect();
    console.log('Connected to PostgreSQL');

    const tables = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    console.log(`Found ${tables.length} tables to migrate`);

    for (const table of tables) {
      const tableName = table.name;
      console.log(`\nMigrating table: ${tableName}`);

      const schema = sqlite.prepare(`PRAGMA table_info(${tableName})`).all();
      
      let createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
      const columns = schema.map(col => {
        let pgType = convertSQLiteTypeToPostgreSQL(col.type);
        let constraint = '';
        
        if (col.pk === 1) {
          if (col.type.toUpperCase() === 'INTEGER') {
            pgType = 'SERIAL PRIMARY KEY';
          } else {
            constraint = ' PRIMARY KEY';
          }
        }
        
        if (col.notnull === 1 && col.pk !== 1) {
          constraint += ' NOT NULL';
        }
        
        if (col.dflt_value !== null) {
          let defaultValue = col.dflt_value;
          if (defaultValue.includes('randomblob')) {
            defaultValue = "gen_random_uuid()";
          } else if (defaultValue.includes('CURRENT_TIMESTAMP')) {
            defaultValue = 'CURRENT_TIMESTAMP';
          }
          constraint += ` DEFAULT ${defaultValue}`;
        }
        
        return `  "${col.name}" ${pgType}${constraint}`;
      });
      
      createTableSQL += columns.join(',\n') + '\n);';
      
      console.log('Creating table schema...');
      await pgClient.query(createTableSQL);

      const data = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
      console.log(`Found ${data.length} rows to migrate`);

      if (data.length > 0) {
        const columnNames = schema.map(col => `"${col.name}"`).join(', ');
        const placeholders = schema.map((_, index) => `$${index + 1}`).join(', ');
        const insertSQL = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const values = schema.map(col => {
            let value = row[col.name];
            if (col.type.toUpperCase().includes('BOOL') && typeof value === 'number') {
              value = value === 1;
            }
            if ((col.name.includes('_at') || col.name.includes('time') || col.name === 'migration_time') 
                && typeof value === 'number' && value > 1000000000) {
              value = new Date(value).toISOString();
            }
            return value;
          });

          try {
            await pgClient.query(insertSQL, values);
          } catch (error) {
            console.error(`Error inserting row ${i + 1}:`, error.message);
            console.error('Row data:', values);
          }
        }
        console.log(`Successfully migrated ${data.length} rows`);
      }
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pgClient.end();
    sqlite.close();
  }
}

function convertSQLiteTypeToPostgreSQL(sqliteType) {
  const type = sqliteType.toUpperCase();
  
  if (type.includes('INT')) return 'INTEGER';
  if (type.includes('TEXT') || type.includes('CHAR') || type.includes('VARCHAR')) return 'TEXT';
  if (type.includes('REAL') || type.includes('DOUBLE') || type.includes('FLOAT')) return 'REAL';
  if (type.includes('NUMERIC') || type.includes('DECIMAL')) return 'NUMERIC';
  if (type.includes('BOOL')) return 'BOOLEAN';
  if (type.includes('DATE') || type.includes('TIME')) return 'TIMESTAMP';
  if (type.includes('BLOB')) return 'BYTEA';
  
  return 'TEXT'; 
}

migrateTables();