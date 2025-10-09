<?php
  $db_server = "localhost";
  $db_user = "root";
  $db_password = "";
  $db_name = "smart_waste_management";
  $conn = "";

  try{
    $conn = mysqli_connect($db_server, $db_user, $db_password, $db_name);
  }catch(mysqli_sql_exception){
    echo "Error in connection";
  }
  
  if($conn){
    echo "You are connected to the database";
  }
?>