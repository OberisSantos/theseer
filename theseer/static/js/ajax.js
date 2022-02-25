
$("#buscaForm").submit(function(e){
    e.preventDefault(); //não carregar a pagina

    let serializeData = $(this).serialize();
    let url = "predict/acao";
    
    
    $.ajax({
        type: 'POST',
        url: url,
        data: serializeData,
        beforeSend: function () {

            $('#load').show();
            
        }, 
        success: function(response){
            $("#load").hide();

            if(response.success == false){
                $("#msg").show();
                document.getElementById("msg").textContent = response.msg;
                $("#erro").show();
                
                setTimeout(function () {
                $("#msg").hide();
                }, 3000);

            }else{
                $("#prevTab").show();
                keras(response);
            }
        },
        error: function(response) { 
            $("#load").hide();
            $("#msg").show();
            document.getElementById("msg").textContent = response.msg;
            $("#erro").show();
            setTimeout(function () {
            $("#msg").hide();
            }, 3000);
        },   
    }) 
});

