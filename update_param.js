const {
    Pool,
  } = require('pg');
  require('dotenv').config();
  
  let pool = null;
  
  function createConnection() {
    if (!pool) pool = new Pool();
    return pool;
  }
  
  async function closeConnections() {
    if (!pool) return;
    try {
      await pool.end();
      pool = null;
    } catch (e) {
      log(e);
    }
  }
  
  async function runQuery({
    connection,
    query,
    params = [],
  }) {
    return connection.query(query, params);
  }
  
  async function getQueryParams(query) {
    const connection = createConnection();
    // console.log(query)

    const result = (await runQuery({
      connection,
      query,
      params: [],
    })).rows;
    return result;
  }



  currentTime = new Date();
  currentYear = currentTime.getFullYear();
  paramChanger = `UPDATE grant_sites_query_param SET param = '{"list": ["${currentYear}", "${currentYear-1}"]}' WHERE id in (2, 3, 4, 32, 200)`;
  results = getQueryParams(paramChanger)
  results.then(function(result){
    console.log(result)
  })


  paramChanger1 = `UPDATE grant_sites_query_param SET param = '{"list": ["${currentYear-1}"]}' WHERE id=30`;
  results2 = getQueryParams(paramChanger1)
  results2.then(function(result){
    console.log(result)
  })

  paramChanger2 = `UPDATE grant_sites_query_param SET param = '{"list": ["${currentYear}"]}' WHERE id=31`;
  results3 = getQueryParams(paramChanger2)
  results3.then(function(result){
    console.log(result)
  })


  tableTruncater = `TRUNCATE TABLE grant_crawled_new;`
  results1 = getQueryParams(tableTruncater)
  results1.then(function(result){
    console.log(result)
  })
  
  console.log("Year Parameters Updated Succesfully")