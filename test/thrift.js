var config = require('./helpers/thrift'),
    system = require('./helpers/connection'),
    Helenus, conn, ks, cf_standard, row_standard;

module.exports = {
  'setUp':function(test, assert){
    Helenus = require('helenus');
    conn = new Helenus.ConnectionPool(system);
    test.finish();
  },

  'test pool.connect':function(test, assert){
    conn.connect(function(err, keyspace){
      assert.ifError(err);
      assert.ok(keyspace.definition.name === 'system');
      test.finish();
    });
  },

  'test pool.createKeyspace':function(test, assert){
    conn.createKeyspace(config.keyspace, function(err){
      assert.ifError(err);
      test.finish();
    });
  },

  'test pool.use':function(test, assert){
    conn.use(config.keyspace, function(err, keyspace){
      assert.ifError(err);
      assert.ok(keyspace instanceof Helenus.Keyspace);
      ks = keyspace;
      test.finish();
    });
  },

  'test standard keyspace.createColumnFamily':function(test, assert){
    ks.createColumnFamily(config.cf_standard, config.cf_standard_options, function(err){
      assert.ifError(err);
      test.finish();
    });
  },

  'test standard keyspace.get':function(test, assert){
    ks.get(config.cf_standard, function(err, columnFamily){
      assert.ifError(err);
      assert.ok(columnFamily instanceof Helenus.ColumnFamily);
      test.finish();
    });
  },
  
  'test standard keyspace.get from cache':function(test, assert){
    ks.get(config.cf_standard, function(err, columnFamily){
      assert.ifError(err);
      assert.ok(columnFamily instanceof Helenus.ColumnFamily);
      cf_standard = columnFamily;
      test.finish();
    });
  },
  
  'test standard keyspace.get invalid cf':function(test, assert){
    ks.get(config.cf_invalid, function(err, columnFamily){
      assert.ok(err instanceof Error);
      assert.ok(err.name === 'HelenusNotFoundError');
      assert.ok(err.message === 'ColumnFamily cf_invalid_test Not Found');
      test.finish();
    });
  },
  
  /**
  As per JIRA: CASSANDRA-3728 (https://issues.apache.org/jira/browse/CASSANDRA-3728)
  There is no validation on column names, so no error will ever be returned. Once this
  issue has been resolved, we can include this test
  'test standard keyspace.get error':function(test, assert){

    
    ks.get(config.cf_error, function(err, columnFamily){
      assert.ifError(err);
      test.finish();
    });
  },
  **/
      
  'test standard cf.insert':function(test, assert){
    cf_standard.insert(config.standard_row_key, config.standard_insert_values, function(err, results){
      assert.ifError(err);
      test.finish();
    });
  },

  'test standard cf.get':function(test, assert){        
    cf_standard.get(config.standard_row_key, function(err, row){
      assert.ifError(err);
      assert.ok(row instanceof Helenus.Row);
      assert.ok(row.count === 4);
      assert.ok(row.key === config.standard_row_key);
      assert.ok(row.get('one').value === 'a');
      assert.ok(row.get('two').value === 'b');
      assert.ok(row.get('three').value === 'c');
      assert.ok(row.get('four').value === '');
      row_standard = row;
      test.finish();
    });  
  },

  'test standard cf.get with options':function(test, assert){    
    cf_standard.get(config.standard_row_key, config.standard_get_options, function(err, row){
      assert.ifError(err);
      assert.ok(row instanceof Helenus.Row);
      assert.ok(row.count === 1);
      assert.ok(row.key === config.standard_row_key);
      assert.ok(row.get('one').value === 'a');
      
      test.finish();
    });
  },
  
  'test standard cf.get with error':function(test, assert){    
    cf_standard.get(config.standard_row_key, config.standard_get_options_error, function(err, row){
      assert.ok(err instanceof Error);
      assert.ok(err.name === 'HelenusInvalidRequestException');
      assert.ok(err.message === 'range finish must come after start in the order of traversal');
      test.finish();
    });
  },
  
  'test standard cf with BytestType':function(test, assert){
    var key = config.standard_row_key + '-bytes',
        opts = { 'bytes-test' : 'BEEFCAFE' };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('bytes-test');        
        assert.ok(col.value instanceof Buffer);
        assert.ok(col.value.toString() === 'BEEFCAFE');
        test.finish();
      });      
    });
  },
  
  'test standard cf with LongType':function(test, assert){
    var key = config.standard_row_key + '-long',
        opts = { 'long-test' : 123456789012345 };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('long-test'); 
        assert.ok(typeof col.value === 'number');
        assert.ok(col.value === 123456789012345);
        test.finish();
      });      
    });
  },
  
  'test standard cf with IntegerType':function(test, assert){
    var key = config.standard_row_key + '-integer',
        opts = { 'integer-test' : 1234 };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('integer-test');        
        assert.ok(typeof col.value === 'number');
        assert.ok(col.value === 1234);
        test.finish();
      });      
    });
  },
  
  'test standard cf with UTF8Type':function(test, assert){
    var key = config.standard_row_key + '-utf8',
        opts = { 'utf8-test' : 'åbcd' };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('utf8-test');        
        assert.ok(typeof col.value === 'string');
        assert.ok(col.value === 'åbcd');
        test.finish();
      });      
    });
  },
  
  'test standard cf with AsciiType':function(test, assert){
    var key = config.standard_row_key + '-ascii',
        opts = { 'ascii-test' : 'abcd' };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('ascii-test');        
        assert.ok(typeof col.value === 'string');
        assert.ok(col.value === 'abcd');
        test.finish();
      });      
    });
  },
  
  'test standard cf with LexicalUUIDType':function(test, assert){
    var key = config.standard_row_key + '-lexicaluuid',
        opts = { 'lexicaluuid-test' : new Helenus.UUID() };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('lexicaluuid-test');      
        assert.ok(col.value instanceof Helenus.UUID);
        assert.ok(col.value.hex.length === 36);
        test.finish();
      });      
    });
  },
  
  'test standard cf with TimeUUIDType':function(test, assert){
    var key = config.standard_row_key + '-timeuuid',
        opts = { 'timeuuid-test' : new Helenus.TimeUUID() };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('timeuuid-test');
        assert.ok(col.value instanceof Helenus.TimeUUID);
        assert.ok(col.value.hex.length === 36);
        test.finish();
      });      
    });
  },
  
  'test standard cf with FloatType':function(test, assert){
    var key = config.standard_row_key + '-float',
        opts = { 'float-test' : 1234.1234130859375 };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('float-test');        
        assert.ok(typeof col.value === 'number');
        assert.ok(col.value === 1234.1234130859375);
        test.finish();
      });      
    });
  },
  
  'test standard cf with DoubleType':function(test, assert){
    var key = config.standard_row_key + '-double',
        opts = { 'double-test' : 123456789012345.1234 };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('double-test');        
        assert.ok(typeof col.value === 'number');
        assert.ok(col.value === 123456789012345.1234);
        test.finish();
      });      
    });
  },
  
  'test standard cf with DateType':function(test, assert){
    var key = config.standard_row_key + '-date',
        opts = { 'date-test' : new Date(1326400762701) };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('date-test');    
        assert.ok(col.value instanceof Date);
        assert.ok(col.value.getTime() === 1326400762701);
        test.finish();
      });      
    });
  },
  
  'test standard cf with BooleanType':function(test, assert){
    var key = config.standard_row_key + '-boolean',
        opts = { 'boolean-test' : true };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('boolean-test');    
        assert.ok(typeof col.value === 'boolean');
        assert.ok(col.value === true);
        test.finish();
      });      
    });
  },
  
  'test standard cf with UUIDType':function(test, assert){
    var key = config.standard_row_key + '-lexicaluuid',
        opts = { 'uuid-test' : new Helenus.UUID() };
        
    cf_standard.insert(key, opts, function(err){
      assert.ifError(err);
      cf_standard.get(key, function(err, row){
        assert.ifError(err);
        var col = row.get('uuid-test');      
        assert.ok(col.value instanceof Helenus.UUID);
        assert.ok(col.value.hex.length === 36);
        test.finish();
      });      
    });
  },
  
  'test row.nameSlice':function(test, assert){
    var row = row_standard.nameSlice('a','s');
    assert.ok(row instanceof Helenus.Row);
    assert.ok(row.count === 2);
    assert.ok(row.key === config.standard_row_key);
    assert.ok(row.get('one').value === 'a');
    assert.ok(row.get('four').value === '');
    test.finish();
  },
  
  'test row.slice':function(test, assert){
    var row = row_standard.slice(1, 3);
    assert.ok(row instanceof Helenus.Row);
    assert.ok(row.count === 2);
    assert.ok(row.key === config.standard_row_key);
    assert.ok(row.get('one').value === 'a');
    assert.ok(row.get('three').value === 'c');
    test.finish();
  },
  
  'test row.toString and row.inspect':function(test, assert){
    var str = row_standard.toString();
    assert.ok(typeof str === 'string');
    assert.ok(str === "<Row: Key: 'standard_row_1', ColumnCount: 4, Columns: [ 'four,one,three,two' ]>");
    test.finish();
  },
  
  'test row.forEach':function(test, assert){
    var i = 0, vals = {
      '0': { name:'four', value:'' },
      '1': { name:'one',  value:'a' },
      '2': { name:'three',value:'c' },
      '3': { name:'two',  value:'b' },  
    };
        
    row_standard.forEach(function(name, value, timestamp, ttl){
      assert.ok(vals[i].name === name);
      assert.ok(vals[i].value === value);
      assert.ok(timestamp instanceof Date);
      assert.ok(ttl === null);
      i += 1;  
    });
    
    test.finish();
  },
  
  'test keyspace.dropColumnFamily':function(test, assert){
    ks.dropColumnFamily(config.cf_standard, function(err){
      assert.ifError(err);
      test.finish();
    });
  },

  'test pool.dropKeyspace':function(test, assert){
    conn.dropKeyspace(config.keyspace, function(err){
      assert.ifError(err);
      test.finish();
    });
  },

  'test pool.close':function(test, assert){
    assert.doesNotThrow(function(){ conn.close(); });
    test.finish();
  },

  'tearDown':function(test, assert){
    test.finish();
  }
};