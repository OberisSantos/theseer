
function criarTabelaReal(preco, previsao){
  alvo = document.getElementById('tablereal');
  alvo.innerText = "";

  let table = document.createElement('table');
  let thead = document.createElement('thead');
  let tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  document.getElementById('tablereal').appendChild(table);

  let head_row = document.createElement('tr');
  let heading_1 = document.createElement('th');
  heading_1.innerHTML = "Dia";
  let heading_2 = document.createElement('th');
  heading_2.innerHTML = "Preço (R$)";
  let heading_3 = document.createElement('th');
  heading_3.innerHTML = "Previsto (R$)";
  let heading_4 = document.createElement('th');
  heading_4.innerHTML = "Diferença (R$)";
  let heading_5 = document.createElement('th');
  heading_5.innerHTML = "Diferença (%)";

  head_row.appendChild(heading_1);
  head_row.appendChild(heading_2);
  head_row.appendChild(heading_3);
  head_row.appendChild(heading_4);
  head_row.appendChild(heading_5);
  thead.appendChild(head_row);

  for(var i=0; i<90; i++){
    let head_row_2 = document.createElement('tr');
    let head_row_2_data_1 = document.createElement('td');
    head_row_2_data_1.innerHTML = i+1;
    let head_row_2_data_2 = document.createElement('td');
    head_row_2_data_2.innerHTML = parseFloat(preco[i]).toFixed(4);
    let head_row_2_data_3 = document.createElement('td');
    head_row_2_data_3.innerHTML = parseFloat(previsao[i]).toFixed(4);
    
    let  diferenca = Math.abs(parseFloat(preco[i] - previsao[i]).toFixed(4));
    let head_row_2_data_4= document.createElement('td');
    head_row_2_data_4.innerHTML = diferenca;

    let porcentagem = parseFloat((diferenca * 100) /  preco[i]).toFixed(2);
    let head_row_2_data_5 = document.createElement('td');
    head_row_2_data_5.innerHTML = porcentagem;
    
    head_row_2.appendChild(head_row_2_data_1);
    head_row_2.appendChild(head_row_2_data_2);
    head_row_2.appendChild(head_row_2_data_3);
  
    head_row_2.appendChild(head_row_2_data_4);
    head_row_2.appendChild(head_row_2_data_5);
  
    tbody.appendChild(head_row_2);
  }

}


function criarTabelaFuturo(data, futuro, range, seletor){
  alvo = document.getElementById(seletor);
  alvo.innerText = "";

  let table = document.createElement('table');
  let thead = document.createElement('thead');
  let tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  document.getElementById(seletor).appendChild(table);

  let head_row = document.createElement('tr');
  let heading_1 = document.createElement('th');
  heading_1.innerHTML = "Dia";
  let heading_2 = document.createElement('th');
  heading_2.innerHTML = "Data";
  let heading_3 = document.createElement('th');
  heading_3.innerHTML = "Futuro (R$)";
  
  head_row.appendChild(heading_1);
  head_row.appendChild(heading_2);
  head_row.appendChild(heading_3);
  thead.appendChild(head_row);

  for(var i=0; i<range; i++){
    let head_row_2 = document.createElement('tr');
    let head_row_2_data_1 = document.createElement('td');
    head_row_2_data_1.innerHTML = i+1;

    var date = data[i];
    var dataFormatada = date.toLocaleDateString('pt-BR', {timeZone: 'UTC'});

    let head_row_2_data_2 = document.createElement('td');
    head_row_2_data_2.innerHTML = dataFormatada;

    let head_row_2_data_3 = document.createElement('td');
    head_row_2_data_3.innerHTML = parseFloat(futuro[i].toFixed(4));
    
    head_row_2.appendChild(head_row_2_data_1);
    head_row_2.appendChild(head_row_2_data_2);
    head_row_2.appendChild(head_row_2_data_3);
  
    tbody.appendChild(head_row_2);
  }
  
}

function keras(response){

  var lstmprevisao = response.lstm_json;
  var lstm_previsao = lstmprevisao.previsao;
  var lstm_preco = lstmprevisao.preco;
  var lstm_data = lstmprevisao.data;
  var lstm_futuro = lstmprevisao.futuro;
  var lstm_data_futuro = lstmprevisao.data_futuro;
  var acao = response.acao;

  document.getElementById("acao").textContent = "Previsão para o ativo - " + acao;


  var data_passada = [];
  for(var i = 0; i < lstm_data.length; i++ ){
    var date = new Date(lstm_data[i]);
    data_passada.push(date);
  };

  var data_futuro = [];
  for(var i = 0; i < lstm_data_futuro.length; i++ ){
    var date = new Date(lstm_data_futuro[i]);    
    data_futuro.push(date);
  };
  
  function validacao(){
    
    var data = [
      {y: lstm_previsao, mode:"lines", name:'previsão'},
      {y: lstm_preco, mode:"lines", name:'preço'}
    ];
    // Define Layout
    var layout = {
      xaxis: {title: "Tempo (dias)"},
      yaxis: {title: "Preço (R$)"},  
      title: "Preço real x previsto",
      width:1000
    };

    // Display using Plotly
    Plotly.newPlot("lstm_real", data, layout);

    criarTabelaReal(lstm_preco, lstm_previsao);

  }

  function previsao30(){
    // Define Data
    var data = [
      {x: data_passada, y: lstm_preco, mode:"lines", name:'preço'},
      {x: data_futuro, y: lstm_futuro, mode:"lines", name:'futuro'}
    ];
    // Define Layout
    var layout = {
      xaxis: {title: "Período", range: [data_passada[0], data_futuro[29]]}, 
      yaxis: {title: "Preço (R$)"},  
      title: "Previsão para 30 dias",
      width:1000
    };

    // Display using Plotly
    Plotly.newPlot("lstm_previsao_30", data, layout);

    criarTabelaFuturo(data_futuro, lstm_futuro, 30, 'futuro30');
  }

  function previsao60(){
    // Define Data
    var data = [
      {x: data_passada, y: lstm_preco, mode:"lines", name:'preço'},
      {x: data_futuro, y: lstm_futuro, mode:"lines", name:'futuro'}
    ];
    // Define Layout
    var layout = {
      xaxis: {title: "Período", range: [data_passada[0], data_futuro[59]]}, 
      yaxis: {title: "Preço (R$)"},  
      title: "Previsão para 60 dias",
      width:1000
    };

    // Display using Plotly
    Plotly.newPlot("lstm_previsao_60", data, layout);

    criarTabelaFuturo(data_futuro, lstm_futuro, 60, 'futuro60');
  }

  function previsao90(){
    // Define Data
    var data = [
      {x: data_passada, y: lstm_preco, mode:"lines", name:'preço'},
      {x: data_futuro, y: lstm_futuro, mode:"lines", name:'futuro'}
    ];
    // Define Layout
    var layout = {
      xaxis: {title: "Período"},
      yaxis: {title: "Preço (R$)"}, 
      title: "Previsão para 90 dias",
      width:1000
    };

    // Display using Plotly
    Plotly.newPlot("lstm_previsao_90", data, layout);

    criarTabelaFuturo(data_futuro, lstm_futuro, 90, 'futuro90');
  }

  validacao();
  previsao30();
  previsao60();
  previsao90();

}
