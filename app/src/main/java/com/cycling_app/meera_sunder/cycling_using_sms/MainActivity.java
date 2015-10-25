package com.cycling_app.meera_sunder.cycling_using_sms;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.telephony.SmsManager;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public class MainActivity extends AppCompatActivity {

        private Button stop_button;
        private Button fast_button;
        private Button slow_button;
        private final SMSReceiver smsReceiver = new SMSReceiver();
        //private BroadcastReceiver msmsReceiver;
        private EditText phone_numbers;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);


        phone_numbers = (EditText)findViewById(R.id.phone_number);
        final String phone_numbers_to_use = phone_numbers.getText().toString();
        //final String[] phone_number_array = phone_numbers_to_use.split(",");
        stop_button = (Button) findViewById(R.id.stop_button);

        if(phone_numbers_to_use == null)
            Toast.makeText(getApplicationContext(),"No phone numbers entered",Toast.LENGTH_LONG);
        stop_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int index=0;
                Toast toast = Toast.makeText(getApplicationContext(),"STOP",Toast.LENGTH_SHORT);
                toast.show();
                String message_to_send = "cycling_app:stop";
               // while(index < phone_number_array.length) {
                    sendSMSMessage(message_to_send, phone_numbers.getText().toString());
                    index++;
               // }
            }
        });

        fast_button = (Button)findViewById(R.id.fast_button);
        fast_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int index=0;
                Toast toast = Toast.makeText(getApplicationContext(),"STOP",Toast.LENGTH_SHORT);
                toast.show();
                String message_to_send = "cycling_app:fast";

               // while(index < phone_number_array.length) {
                    sendSMSMessage(message_to_send, phone_numbers.getText().toString());
                    index++;
                //}
            }
        });

        slow_button = (Button)findViewById(R.id.slow_button);
        slow_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int index = 0;
                Toast toast = Toast.makeText(getApplicationContext(), "SLOW DOWN", Toast.LENGTH_SHORT);
                toast.show();
                String message_to_send = "cycling_app:slow";

                //  while(index < phone_number_array.length) {
                sendSMSMessage(message_to_send, phone_numbers.getText().toString());
                index++;
                //}
            }
        });

       /* IntentFilter intent_filter =
                new IntentFilter("com.cycling_app.meera_sunder.cycling_using_sms.SMSReceiver");//(this, SMSReceiver.class);
        intent_filter.addAction("android.provider.Telephony.SMS_RECEIVED");

        //smsReceiver = new SMSReceiver();
        registerReceiver(smsReceiver, intent_filter);*/
        //PendingIntent pendingIntent = new PendingIntent.getBroadcast(this.getApplicationContext(), intent);
       //1 registerReceiver(SMSReceiver.class, new IntentFilter("android.intent.action.SMS_REVEICE"));

        /*IntentFilter filter = new IntentFilter()
        SMSReceiver smsReceiver = new SMSReceiver();
       registerReceiver(smsReceiver);*/
    }

    @Override
    protected void onPause() {
        super.onPause();
        Toast.makeText(getApplicationContext(),"Pause",Toast.LENGTH_LONG);
        /*try {
            unregisterReceiver(smsReceiver);
        }
        catch(Exception e) {
            Toast.makeText(getApplicationContext(), "Failed to unregister", Toast.LENGTH_LONG).show();
            e.printStackTrace();
        }*/
    }

    @Override
    protected void onStop() {
        super.onStop();
        try {
            unregisterReceiver(smsReceiver);
        }
        catch(Exception e) {
            Toast.makeText(getApplicationContext(), "Failed to unregister", Toast.LENGTH_LONG).show();
            e.printStackTrace();
        }
    }

    public void sendSMSMessage (String message_to_send,String phoneNo){
        Log.i("Sending SMS","");
       // String phoneNo = "4125353131";

        String message = message_to_send;
        Toast.makeText(getApplicationContext(), phoneNo, Toast.LENGTH_LONG);
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phoneNo, null, message_to_send,null,null);
            Toast.makeText(getApplicationContext(),"Message sent to" + phoneNo, Toast.LENGTH_LONG).show();
        }
        catch (Exception e) {
            Toast.makeText(getApplicationContext(), "Failed to send Message" + phoneNo, Toast.LENGTH_LONG).show();
            e.printStackTrace();
        }
    }

}
