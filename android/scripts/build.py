#!/usr/bin/env python3
"""Build a reproducible dependency-free Android companion with official SDK tools."""
from pathlib import Path
import os,subprocess,zipfile,shutil
root=Path(__file__).resolve().parents[2]
sdk=Path(os.environ.get('ANDROID_HOME',str(Path.home()/'Library/Android/sdk')))
java=Path(os.environ.get('JAVA_HOME','/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home'))
bt=sdk/'build-tools/36.0.0'; platform=sdk/'platforms/android-37.0/android.jar'
if not platform.exists(): raise SystemExit('Set ANDROID_HOME to an SDK containing platforms/android-37.0/android.jar')
build=root/'android/build';build.mkdir(exist_ok=True);classes=build/'classes';classes.mkdir(exist_ok=True);dex=build/'dex';dex.mkdir(exist_ok=True)
def run(*args):subprocess.run([str(x) for x in args],check=True,env={**os.environ,'JAVA_HOME':str(java)})
run(bt/'aapt2','compile','--dir',root/'android/app/src/main/res','-o',build/'resources.zip')
run(bt/'aapt2','link','-o',build/'unsigned.apk','-I',platform,'--manifest',root/'android/app/src/main/AndroidManifest.xml','--min-sdk-version','26','--target-sdk-version','35',build/'resources.zip')
run(java/'bin/javac','--release','8','-classpath',platform,'-d',classes,*list((root/'android/app/src/main/java').rglob('*.java')))
run(bt/'d8','--lib',platform,'--min-api','26','--output',dex,*list(classes.rglob('*.class')))
with zipfile.ZipFile(build/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as apk:
 for f in dex.glob('*.dex'):apk.write(f,f.name)
run(bt/'zipalign','-p','-f','4',build/'unsigned.apk',build/'aligned.apk')
private=root/'android/.private';private.mkdir(exist_ok=True);key=private/'development.keystore'
if not key.exists():run(java/'bin/keytool','-genkeypair','-keystore',key,'-storepass','android','-keypass','android','-alias','androiddebugkey','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Nivetha OS Development,O=Personal,C=IN')
out=root/'outputs/Nivetha-OS.apk';out.parent.mkdir(exist_ok=True)
run(bt/'apksigner','sign','--ks',key,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--out',out,build/'aligned.apk')
run(bt/'apksigner','verify','--verbose',out)
print('APK ready:',out)
