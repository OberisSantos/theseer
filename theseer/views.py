import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from django.shortcuts import render
import pandas as pd
import numpy as np
#import json
from django.http import JsonResponse
import yfinance as yf
#import pandas_datareader as pdr
#from sklearn.metrics import  mean_absolute_error, mean_squared_error
from sklearn.model_selection import  train_test_split
#from math import sqrt
from keras.models import  Sequential, load_model
from keras.layers import Dense, Dropout, LSTM
from sklearn.preprocessing import StandardScaler
from keras.callbacks import ReduceLROnPlateau, EarlyStopping, ModelCheckpoint


def home(request):
    return render(request, 'acao/home.html', {})

def predict(request):
  indice = request.POST['indice']
  acao = indice.upper()

  indice = indice.strip()+'.SA'
  codigo = [indice]
  try:
    dataset =  get_acao(codigo)
    
    if(dataset.empty):
      return JsonResponse({"success":False, 'msg': 'O ativo pesquisado ' + acao + ' não foi encontrado'}, status=200)    
    
    prev_lstm = lstm(dataset)
  
    return JsonResponse({"success":True, "lstm_json":prev_lstm, 'acao':acao}, status=200)
  except:
    return JsonResponse({"success":False, 'msg': 'Houve um erro, tenta novamente!'}, status=200)


def get_acao(codigo=[]):#padrão de 10 anos para o período
  yf.pdr_override()
  df = pd.DataFrame()
  for acao in codigo:
    #df[acao] = yf.Ticker(acao).history(period = (str(periodo)+'y'))['Close']
    #df[acao] = yf.download(acao, start="2017-01-19")['Close']
    df[acao] = yf.download(acao, start="2017-01-19", end='2022-01-19')['Close']
  return df

#previsao com rede neural recorrente lstm-keras
def lstm(df, n_futuro=90, steps=100):	
  df_original = df.reset_index() #resetar o index
  acoes = df_original.set_index(pd.DatetimeIndex(df_original['Date'].values))

  df_colunas = acoes.columns
  codigo = df_colunas[1] #pegar o código da ação

  df_close = acoes[codigo]
  df_close.dropna(inplace=True) #remover valores nulos

  #normalizar os dados: importante para meu modelo não endender que um valor é mais importante que outro
  df_close = pd.DataFrame(df_close)
  scaler = StandardScaler()
  df_scaled = scaler.fit_transform(df_close)

  #separar treino e teste   sendo 20% para teste  
  train, test = train_test_split(df_scaled, test_size=0.2, shuffle=False)

  #gerando dados de treino e teste
  steps = steps #considerar os 30 valores para prever o 31
  epochs = 100
  #Criar um função que retorna array para treinar e testar
  X_train, Y_train = create_df(train, steps)
  X_test, Y_test = create_df(test, steps)
  #######
  #X_df, Y_df = create_df(df_scaled, steps)
  ######
  #gerando os dados no formato do modelo
  X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1) #recriando os dados de treinamento - o 1 é a quantidades de fitware
  X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)
  #######
  #X_df = X_df.reshape(X_df.shape[0], X_df.shape[1], 1)
  #######
  #montar as camadas da redes
  model = Sequential() #return_sequences=True - cria uma memomira para o modelo

  model.add(LSTM(35, return_sequences=True, input_shape=(steps, 1))) #o 35 é a quantidade de neuronios
  model.add(LSTM(35, return_sequences=True)) #criar mais uma camada
  model.add(LSTM(35))
  model.add(Dropout(0.2)) #Dropout - para regularizar o modelo para evitar o Overfitting
  model.add(Dense(1)) #camada de saída com 1 valor previsto

  #compilar o modelo
  model.compile(optimizer='adam', loss='mse')

  #treinar o modelo sem stop
  model.fit(X_train, Y_train, epochs=epochs, batch_size=steps, verbose=0, shuffle=False)
  #model.fit(X_df, Y_df, epochs=epochs, batch_size=steps, verbose=0, shuffle=False)

  #Salvar o modelo treinado
  #model.save('acao/media/lstm/modeloTreinado.h5')

  #Realizar uma previsão para validar o modelo
  previsao_validacao = model.predict(X_test)

  #inverter os valores de normalizado para o valor real
  previsao_validacao = scaler.inverse_transform(previsao_validacao) 

  #criar um DataFrame como os valores real e os valores previsto para validar o modelo
  #pegar os valores real
  Y_real = Y_test.reshape(-1,1)
  #inverter os valores 
  Y_real = scaler.inverse_transform(Y_real)
  df_validacao = pd.DataFrame(previsao_validacao)
  df_validacao.rename(columns={0: 'previsao'}, inplace=True)
  df_validacao['data'] = df_close.index[-len(Y_real):]
  df_validacao['preco'] = Y_real

  #Reload model
  #model = load_model('acao/media/lstm/modeloTreinado.h5')
  
  #remover o modelo salvo
  #if os.path.exists('acao/media/lstm/modeloTreinado.h5'):
    #os.remove('acao/media/lstm/modeloTreinado.h5')

  #treinar novamenete o modelo com os demais dados
  model.fit(X_test, Y_test, epochs=epochs, batch_size=steps, verbose=0, shuffle=False)

  #Realizar previsão para os dias futuro

  n_futuro = n_futuro #dias para o futuro
  prediction_list = X_test[-1:] #pegar os steps valores para prever o próximo

  for _ in range(n_futuro):
    x = prediction_list[-steps:]
    x = np.array(x)
    x = x.reshape((1, steps, 1))
    #limpar os dados
    model.reset_states()
    out = model.predict(x, batch_size=steps)[0][0] #pegar o valor previsto
    prediction_list = np.append(prediction_list, out) #adicionar o valor previsto no final da lista
    #limpar os dados
    #model.reset_states()

  predict_futuro = prediction_list[steps:] #carregar somenente os n_futuro valores previsto

  #inverter os valores 
  predict_futuro = predict_futuro.reshape(-1,1)
  futuro_previsto = scaler.inverse_transform(predict_futuro)

  #criar um DataFrame com os valores futuro
  df_futuro = pd.DataFrame(futuro_previsto)
  df_futuro.rename(columns={0:'futuro'}, inplace=True)

  #criar datas referente aos valoes Real
  dates = pd.to_datetime(df_close.index[-len(Y_real):])
  #Datas para o futuro, considerar apenas dias úteis
  predict_dates = pd.date_range(list(dates)[-1] + pd.DateOffset(1), periods=n_futuro, freq='b').tolist()

  #Adicionar as datas ao DataFrame df_futuro
  df_futuro['data'] = predict_dates

  dados = {
    'previsao': df_validacao['previsao'].to_list(),
    'preco': df_validacao['preco'].to_list(),
    'data': df_validacao['data'].to_list(),
    #'validacao': validacao,
    'futuro': df_futuro['futuro'].to_list(),
    'data_futuro': df_futuro['data'].to_list(),
    #'metrica': metrica_treino
  }

  return dados

#converte em array de valores
def create_df(df, steps=1):
  dataX, dataY = [], []
  for i in range(len(df)- steps - 1):
    a = df[i:(i+steps), 0]
    dataX.append(a)
    dataY.append(df[i + steps, 0])

  return np.array(dataX), np.array(dataY)

