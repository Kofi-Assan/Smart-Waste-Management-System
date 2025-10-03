<?php
$host="localhost";
$user="root";
$password="";
$db="smart_waste_management_system";
$conn=new mysqli($host,$user,$password,$db);
if($conn->connect_error){
    echo "Connection failed: ".$conn->connect_error;
}
?>