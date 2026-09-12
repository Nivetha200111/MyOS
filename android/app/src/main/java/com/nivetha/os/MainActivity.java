package com.nivetha.os;
import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.os.Bundle;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;

/** Native companion. Account sessions and authoritative records stay in the browser-backed private OS. */
public final class MainActivity extends Activity {
  private static final String ORIGIN="https://nivetha-os-command.niv2001.chatgpt.site";
  private final int mint=Color.rgb(167,234,203), muted=Color.rgb(153,175,185);
  private int dp(float value){return (int)(value*getResources().getDisplayMetrics().density+.5f);}
  @Override public void onCreate(Bundle state){super.onCreate(state);
    ScrollView scroll=new ScrollView(this);scroll.setBackgroundColor(Color.rgb(10,16,21));scroll.setFillViewport(true);
    LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(dp(28),dp(26),dp(28),dp(30));scroll.addView(root);
    root.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(dp(28)+insets.getSystemWindowInsetLeft(),dp(20)+insets.getSystemWindowInsetTop(),dp(28)+insets.getSystemWindowInsetRight(),dp(24)+insets.getSystemWindowInsetBottom());return insets;});
    text(root,"N  /  NIVETHA OS",16,mint,1.8f);space(root,10);text(root,"YOUR PERSONAL CONTROL CENTER",10,muted,1.4f);
    OrbitView orb=new OrbitView();orb.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);root.addView(orb,new LinearLayout.LayoutParams(-1,dp(250)));
    text(root,"You have the drive.",30,Color.rgb(229,239,240),-.5f);text(root,"Give it direction.",30,mint,-.5f);space(root,15);
    text(root,"One work outcome. One problem understood. One step toward your own product.",15,muted,0);space(root,27);
    button(root,"OPEN MISSION CONTROL  →","/",true);space(root,15);
    LinearLayout row=new LinearLayout(this);row.setOrientation(LinearLayout.HORIZONTAL);root.addView(row);tile(row,"01  TODAY","Your big three","/today");tile(row,"02  LEETCODE","Pattern practice","/leetcode");
    space(root,12);LinearLayout row2=new LinearLayout(this);row2.setOrientation(LinearLayout.HORIZONTAL);root.addView(row2);tile(row2,"03  BODY + LIFE","Recovery counts","/fitness");tile(row2,"04  REVIEW","Reflect. Remove.","/reviews");
    space(root,25);text(root,"THE TWO-YEAR MISSION",10,mint,1.6f);space(root,10);text(root,"September 2026 → August 2028",14,Color.rgb(212,226,226),0);space(root,10);text(root,"Strong engineer. Strong body. A life of your own.",14,muted,0);space(root,24);
    text(root,"Private online workspace · Internet required",12,muted,0);space(root,6);text(root,"Opens securely in your browser. Sign in with the same ChatGPT account on each device to use the same workspace.",12,muted,0);space(root,20);text(root,"Discipline includes knowing when to stop.",12,mint,0);
    setContentView(scroll);
  }
  private void text(LinearLayout p,String value,float size,int color,float spacing){TextView t=new TextView(this);t.setText(value);t.setTextColor(color);t.setTextSize(size);t.setLetterSpacing(spacing/Math.max(size,1));t.setLineSpacing(dp(4),1);p.addView(t,new LinearLayout.LayoutParams(-1,-2));}
  private void space(LinearLayout p,int h){p.addView(new View(this),new LinearLayout.LayoutParams(1,dp(h)));}
  private GradientDrawable bg(int color,int stroke){GradientDrawable g=new GradientDrawable();g.setColor(color);g.setCornerRadius(dp(10));if(stroke!=0)g.setStroke(dp(1),stroke);return g;}
  private void button(LinearLayout p,String label,String route,boolean primary){Button b=new Button(this);b.setText(label);b.setTextSize(13);b.setAllCaps(false);b.setTextColor(Color.rgb(17,48,36));b.setBackground(bg(mint,0));b.setMinHeight(dp(54));b.setOnClickListener(v->open(route));p.addView(b,new LinearLayout.LayoutParams(-1,dp(54)));}
  private void tile(LinearLayout p,String title,String sub,String route){LinearLayout tile=new LinearLayout(this);tile.setOrientation(LinearLayout.VERTICAL);tile.setPadding(dp(13),dp(19),dp(12),dp(19));tile.setBackground(bg(Color.rgb(18,28,35),Color.rgb(43,63,69)));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,-1,1);if(p.getChildCount()>0)lp.leftMargin=dp(12);p.addView(tile,lp);text(tile,title,11,mint,.3f);space(tile,9);text(tile,sub,12,muted,0);tile.setClickable(true);tile.setFocusable(true);tile.setContentDescription(title+", "+sub);tile.setOnClickListener(v->open(route));}
  private void open(String route){Intent intent=new Intent(Intent.ACTION_VIEW,Uri.parse(ORIGIN+route));Bundle extras=new Bundle();extras.putBinder("android.support.customtabs.extra.SESSION",null);intent.putExtras(extras);intent.putExtra("android.support.customtabs.extra.TOOLBAR_COLOR",Color.rgb(10,16,21));intent.putExtra("android.support.customtabs.extra.TITLE_VISIBILITY",1);intent.putExtra("androidx.browser.customtabs.extra.COLOR_SCHEME",2);try{startActivity(intent);}catch(ActivityNotFoundException e){new android.app.AlertDialog.Builder(this).setTitle("A browser is needed").setMessage("Install or enable an Android browser, then reopen Nivetha OS.").setPositiveButton("OK",null).show();}}
  private final class OrbitView extends View {private final Paint paint=new Paint(3);OrbitView(){super(MainActivity.this);}protected void onDraw(Canvas c){super.onDraw(c);float x=getWidth()/2f,y=getHeight()/2f,r=dp(70);paint.setShader(new RadialGradient(x,y,r*1.7f,new int[]{0x335BCC9A,0x0049C69D},null,Shader.TileMode.CLAMP));c.drawCircle(x,y,r*1.7f,paint);paint.setShader(null);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(1));paint.setColor(0x335BB99C);c.drawCircle(x,y,r*1.36f,paint);c.drawCircle(x,y,r*1.65f,paint);c.save();c.rotate(-25,x,y);c.drawOval(x-r*1.95f,y-r*.60f,x+r*1.95f,y+r*.60f,paint);c.restore();paint.setStyle(Paint.Style.FILL);paint.setShader(new RadialGradient(x-r*.38f,y-r*.45f,r*1.6f,new int[]{0xffB8EED5,0xff436F64,0xff0E1D26},new float[]{0,.38f,1},Shader.TileMode.CLAMP));c.drawCircle(x,y,r,paint);paint.setShader(null);paint.setStyle(Paint.Style.STROKE);paint.setColor(0x557BE1B4);c.drawCircle(x,y,r,paint);c.save();Path clip=new Path();clip.addCircle(x,y,r,Path.Direction.CW);c.clipPath(clip);c.rotate(-28,x,y);paint.setColor(0x338CE2BB);for(int i=-9;i<10;i++){float yy=y+i*dp(9);c.drawOval(x-r*1.2f,yy-dp(16),x+r*1.2f,yy+dp(16),paint);}c.restore();paint.setStyle(Paint.Style.FILL);}
  }
}
