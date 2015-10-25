package com.cycling_app.meera_sunder.cycling_using_sms;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.widget.Toast;

/**
 * Created by sunmeera on 10/18/2015.
 */
public class SMSReceiver extends BroadcastReceiver{
    private static final String SMS_EXTRA_NAME = "pdus";
    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle bundle = intent.getExtras();
        SmsMessage[] msgs = null;
        Toast.makeText(context, "Message received", Toast.LENGTH_LONG).show();

        boolean update_activity = false;
        String messages = "";
        String phone_number = "Phone_number";
        String msg_rcv = "MSG";
        String message_received = "";
        if ( bundle != null )
        {
            // Get received SMS array
            Object[] pdus = (Object[]) bundle.get( SMS_EXTRA_NAME );

            // Get ContentResolver object for pushing encrypted SMS to the incoming folder
           // ContentResolver contentResolver = context.getContentResolver();
            msgs = new SmsMessage[pdus.length];
            for ( int i = 0; i < msgs.length; ++i )
            {
                msgs[i] = SmsMessage.createFromPdu((byte[])pdus[i]);
                Toast.makeText(context, "For loop!!!", Toast.LENGTH_SHORT).show();
                String body = msgs[i].getMessageBody().toString();
                String address = msgs[i].getOriginatingAddress();

                messages += "SMS from " + address + " :\n";
                messages += body + "\n";

              //  if(address.contains("4125964901"))
              //  {
                    if(body.contains("cycling_app")) {
                        update_activity = true;
                        Toast.makeText(context, "Cycling received", Toast.LENGTH_SHORT).show();
                        if (body.contains("stop")) {
                            Toast.makeText(context,"Slow reveiced",Toast.LENGTH_SHORT).show();
                            message_received = "stop";
                        }
                        else if(body.contains("fast")) {
                            message_received = "fast";
                        }
                        else if(body.contains("slow")) {
                            message_received = "slow";
                        }
                    }
                    else
                        Toast.makeText(context,"Not CYCLING", Toast.LENGTH_SHORT).show();

               // }
                //else
                  //  Toast.makeText(context,"Not 4125964901", Toast.LENGTH_SHORT).show();
                if (update_activity == true) {
                    Intent intent_flash = new Intent(context, Avtivity_flash_message.class);
                    //intent_flash.addFlags(intent.FLAG_ACTIVITY_CLEAR_TASK);
                    intent_flash.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                   // intent_flash.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    //intent_flash.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    intent_flash.putExtra(msg_rcv, message_received);
                    intent_flash.putExtra(phone_number, address);
                    context.startActivity(intent_flash);
                }
                //setAc
                // Here you can add any your code to work with incoming SMS
                // I added encrypting of all received SMS

                //putSmsToDatabase( contentResolver, sms );

             }

            // Display SMS message
            Toast.makeText( context, messages, Toast.LENGTH_SHORT ).show();
        }

        Toast.makeText(context, "Received message", Toast.LENGTH_SHORT);
    }
}
