<?php
  $db_server = "localhost";
  $db_user = "root";
  $db_password = "";
  $db_name = "smart_waste_management";
  $conn = "";

  $conn = mysqli_connect($db_server, $db_user, $db_password, $db_name);
  if($conn){
    echo "You are connected to the database";
  }
  else{
    echo "Could not connect";
  }
?>