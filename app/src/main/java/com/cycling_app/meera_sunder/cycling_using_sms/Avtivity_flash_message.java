package com.cycling_app.meera_sunder.cycling_using_sms;

import android.content.Intent;
import android.graphics.Color;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.telephony.SmsManager;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

public class Avtivity_flash_message extends AppCompatActivity {
    private String memberFieldString;
    private String memberphonenumber;
    /*private LinearLayout linearlayout;
    private TextView valueTV;*/
    public Ringtone r;
    private Button button;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_avtivity_flash_message);
       // linearlayout = (LinearLayout)findViewById(R.id.linear_layout);
        button = (Button)findViewById(R.id.button_receive);
        Intent intent = getIntent();
        memberFieldString = intent.getStringExtra("MSG");
        memberphonenumber = intent.getStringExtra("Phone_number");
        //valueTV = new TextView(this);
        Uri notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        r = RingtoneManager.getRingtone(getApplicationContext(), notification);
        r.play();

        if(memberFieldString != null) {
            if (memberFieldString.contains("stop")) {
                button.setBackgroundColor(Color.RED);
                button.setText("STOP");
         /*       linearlayout.setBackgroundColor(Color.RED);
                valueTV.setText("STOP");
                valueTV.setLayoutParams(new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT));*/
            }
            if (memberFieldString.contains("fast")) {
                button.setBackgroundColor(Color.GREEN);
                button.setText("GO FASTER!!!");
               // linearlayout.setBackgroundColor(Color.GREEN);
               /* valueTV.setText("GO FASTER!!!");
                valueTV.setLayoutParams(new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT));*/
            }
            if (memberFieldString.contains("slow")) {
                button.setBackgroundColor(Color.BLUE);
                button.setText("SLOW DOWN!!!");
              //  linearlayout.setBackgroundColor(Color.BLUE);
                /*valueTV.setText("SLOW DOWN");
                valueTV.setLayoutParams(new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT));*/
            }
           // linearlayout.addView(valueTV);
        }
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                r.stop();
                sendSMSMessage("OK");
                finish();
            }
        });
    }
    public void sendSMSMessage (String message_to_send){
        Log.i("Sending SMS", "");
        String phoneNo = memberphonenumber;

        String message = message_to_send;

        Toast.makeText(getApplicationContext(),"Phone number" + phoneNo,Toast.LENGTH_LONG).show();

        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phoneNo, null, message_to_send,null,null);
            Toast.makeText(getApplicationContext(),"Message sent", Toast.LENGTH_SHORT).show();
        }
        catch (Exception e) {
            Toast.makeText(getApplicationContext(), "Failed to send Message", Toast.LENGTH_LONG).show();
            e.printStackTrace();
        }
    }
    @Override
    protected void onResume() {
        super.onResume();
        Intent intent = getIntent();
        button = (Button)findViewById(R.id.button_receive);
       // Intent intent = getIntent();
        memberFieldString = intent.getStringExtra("MSG");
        memberphonenumber = intent.getStringExtra("Phone_number");
        //valueTV = new TextView(this);
        Uri notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        r = RingtoneManager.getRingtone(getApplicationContext(), notification);
        r.play();

        if(memberFieldString != null) {
            if (memberFieldString.contains("stop")) {
                button.setBackgroundColor(Color.RED);
                button.setText("STOP");
         /*       linearlayout.setBackgroundColor(Color.RED);
                valueTV.setText("STOP");
                valueTV.setLayoutParams(new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT));*/
            }
            if (memberFieldString.contains("fast")) {
                button.setBackgroundColor(Color.GREEN);
                button.setText("GO FASTER!!!");
                // linearlayout.setBackgroundColor(Color.GREEN);
               /* valueTV.setText("GO FASTER!!!");
                valueTV.setLayoutParams(new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT));*/
            }
            if (memberFieldString.contains("slow")) {
                button.setBackgroundColor(Color.BLUE);
                button.setText("SLOW DOWN!!!");
                //  linearlayout.setBackgroundColor(Color.BLUE);
                /*valueTV.setText("SLOW DOWN");
                valueTV.setLayoutParams(new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT));*/
            }
            // linearlayout.addView(valueTV);
        }
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                r.stop();
                sendSMSMessage("OK");
                finish();
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        memberFieldString = intent.getStringExtra("MSG");

        super.onNewIntent(intent);
    }
}
