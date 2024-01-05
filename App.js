import { TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Callout } from 'react-native-maps';
import firebase from 'firebase';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { Modal } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAANqmXsEJkOHSnUe3YlalR2dyVMNMygVM",
  authDomain: "depremo-15faf.firebaseapp.com",
  databaseURL: "https://depremo-15faf-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "depremo-15faf",
  storageBucket: "depremo-15faf.appspot.com",
  messagingSenderId: "345721208514",
  appId: "1:345721208514:web:1aa6c11dff175417f8c55b"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

function AnaSayfa({ navigation }) {
  const [konum, setKonum] = useState();
  const [kullanici, setKullanici] = useState();
  const [konumPaylasimi, setKonumPaylasimi] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum izni gereklidir.');

        let lastKnownPosition = await Location.getLastKnownPositionAsync({});
        setKonum(lastKnownPosition.coords);
      } else {
        let konum = await Location.getCurrentPositionAsync({});
        setKonum(konum.coords);
      }
    })();
  }, []);

  const kullaniciBilgileri = () => {
    firebase
      .database()
      .ref('kullanicilar/' + firebase.auth().currentUser.uid)
      .on('value', (snapshot) => {
        setKullanici(snapshot.val());
      });
  };
  const updateLocationInFirebase = async () => {
  let currentUserId = firebase.auth().currentUser.uid;
  let location = await Location.getCurrentPositionAsync({});
  firebase
    .database()
    .ref('kullanicilar/' + currentUserId)
    .update({
      konum: location.coords
    });
};
// Firebase'den tüm kullanıcı konumlarını al
const [userLocations, setUserLocations] = useState([]); 
const fetchUserLocations = () => {
  firebase
    .database()
    .ref('kullanicilar')
    .on('value', (snapshot) => {
      const usersData = snapshot.val();
      const usersArray = Object.keys(usersData).map(key => ({
        ...usersData[key],
        id: key
      }));
      setUserLocations(usersArray);
    });
};


const guvendeyimBasildi = async () => {
  let currentUserId = firebase.auth().currentUser.uid;

  if (konumPaylasimi) {
    Alert.alert('Konum paylaşımı kapandı.');
    // Konum paylaşımını kapat
    firebase
      .database()
      .ref('kullanicilar/' + currentUserId)
      .update({
        konum: null
      })
      .then(() => {
        console.log('Kullanıcının konumu güncellendi');
        setKonumPaylasimi(false);
      })
      .catch((error) => {
        console.error('Kullanıcının konumunu güncellerken bir hata oluştu:', error);
      });
  } else {
    Alert.alert('Konum paylaşımı açıldı.');
    // Konum paylaşımını aç
    let konum = await Location.getCurrentPositionAsync({});
    firebase
      .database()
      .ref('kullanicilar/' + currentUserId)
      .update({
        konum: konum.coords
      })
      .then(() => {
        console.log('Kullanıcının konumu güncellendi');
        setKonumPaylasimi(true);
      })
      .catch((error) => {
        console.error('Kullanıcının konumunu güncellerken bir hata oluştu:', error);
      });
  }
};

  const yardimCagirBasildi = () => {
    let phoneNumber = '';

    if (Platform.OS === 'android') {
      phoneNumber = 'tel:112';
    } else {
      phoneNumber = 'telprompt:112';
    }

    Linking.openURL(phoneNumber);
};

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Ana Sayfa</Text>
{konum ? (
  <MapView
    style={stiller.harita}
    region={{
      latitude: konum.latitude,
      longitude: konum.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }}
  >
          <Marker
      coordinate={{
        latitude: konum.latitude,
        longitude: konum.longitude,
      }}
      onPress={() => navigation.navigate('KullaniciBilgileri', { kullaniciId: firebase.auth().currentUser.uid })}
    />
  )

 {userLocations.map((userLocation) => (
  userLocation.konum ? (
    <Marker
      key={userLocation.id}
      coordinate={{
        latitude: userLocation.konum.latitude,
        longitude: userLocation.konum.longitude,
      }}
      onPress={() => navigation.navigate('KullaniciBilgileri', { kullaniciId: userLocation.id })}
    />
  ) : null
))}
  </MapView>
) : null}

      <Button title="Güvendeyim" onPress={guvendeyimBasildi} />
      <Button title="Yardım Çağır" onPress={yardimCagirBasildi} />

      <Button
        title="Konum Paylaşımı ve Kişisel Bilgiler"
        onPress={() => navigation.navigate('KonumPaylasim')}
      />
      <Button
        title="Düdük Çal Butonu"
        onPress={() => navigation.navigate('DudukCal')}
      />
      
    </View>
  );
}

function KullaniciBilgileri({ route }) {
  const [kullanici, setKullanici] = useState(null);

  useEffect(() => {
    firebase
      .database()
      .ref('kullanicilar/' + route.params.kullaniciId)
      .on('value', (snapshot) => {
        setKullanici(snapshot.val());
      });
  }, );

  const ara = () => {
    let phoneNumber = '';

    if (Platform.OS === 'android') {
      phoneNumber = `tel:${kullanici.telefon}`;
    } else {
      phoneNumber = `telprompt:${kullanici.telefon}`;
    }

    Linking.openURL(phoneNumber);
  };

  return (
    <View style={stiller.kapsayici}>
      <Text>Kullanıcı Bilgileri</Text>
      {kullanici && (
        <>
          <Text>{kullanici.ad}</Text>
          <Text>{kullanici.soyad}</Text>
          <Text>{kullanici.telefon}</Text>
          <Button title="Ara" onPress={ara} />
        </>
      )}
    </View>
  );
}



function KonumPaylasim({ navigation }) {
  const [telefon, setTelefon] = useState('');
  const [kullanici, setKullanici] = useState(null);

  useEffect(() => {
    firebase
      .database()
      .ref('kullanicilar/' + firebase.auth().currentUser.uid)
      .on('value', (snapshot) => {
        setKullanici(snapshot.val());
        setTelefon(snapshot.val().telefon);
      });
  }, []);

  const telefonuGuncelle = () => {
    firebase
      .database()
      .ref('kullanicilar/' + firebase.auth().currentUser.uid)
      .update({
        telefon: telefon
      })
      .then(() => {
        console.log('Kullanıcının telefon numarası güncellendi');
      })
      .catch((error) => {
        console.error('Kullanıcının telefon numarasını güncellerken bir hata oluştu:', error);
      });
  };

  return (
    <View style={stiller.kapsayici}>
      <Text>Konum Paylaşımı ve Kişisel Bilgiler Sayfası</Text>
      {kullanici && (
        <>
          <Text>{kullanici.ad}</Text>
          <Text>{kullanici.soyad}</Text>
          <TextInput
            style={stiller.girisYapInput}
            placeholder="Telefon"
            onChangeText={setTelefon}
            value={telefon}
          />
          <Button title="Telefonu Güncelle" onPress={telefonuGuncelle} />
        </>
      )}
    </View>
  );
}

function GirisYap({ navigation }) {
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [hataMesaji, setHataMesaji] = useState(null);

  const girisYap = () => {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, sifre)
      .then((userCredentials) => {
        if (userCredentials.user) {
          console.log('Kullanıcı giriş yaptı:', email);
          navigation.navigate('AnaSayfa');
        }
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('Kullanıcı girişi başarısız:', errorCode, errorMessage);
      });
  };
    const yardimCagirBasildi = () => {
    let phoneNumber = '';

    if (Platform.OS === 'android') {
      phoneNumber = 'tel:112';
    } else {
      phoneNumber = 'telprompt:112';
    }

    Linking.openURL(phoneNumber);
  };

async function sesCal() {
    console.log('Ses yükleniyor');
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/duduk.mp3')
     
    );
    

    console.log('Ses çalınıyor');
    await sound.playAsync();
        return (
      <View style={stiller.kapsayici}>
        <Text>Düdük Çal Butonu Sayfası</Text>
        <Button title="Düdük Çal" onPress={sesCal} />
      </View>
    );
  }
  
  

  return (
    <View style={stiller.kapsayici}>
      <Text>Giriş Yap</Text>
      {hataMesaji && <Text style={{ color: 'red' }}>{hataMesaji}</Text>}
      <TextInput style={stiller.girisYapInput} placeholder="Email" onChangeText={setEmail} value={email} />
      <TextInput style={stiller.girisYapInput} placeholder="Şifre" onChangeText={setSifre} value={sifre} secureTextEntry />
      
      <TouchableOpacity onPress={sesCal} style={stiller.iconButton}>
        <Image source={require('/assets/duduk_icon.png')} style={stiller.icon} />
      </TouchableOpacity>

      <TouchableOpacity onPress={yardimCagirBasildi} style={stiller.iconButton}>
        <Image source={require('./assets/yardim_icon.png')} style={stiller.icon} />
      </TouchableOpacity>

      <View style={stiller.buton}>
        <Text style={stiller.butonText} onPress={girisYap}>Giriş Yap</Text>
      </View>
      <View style={stiller.buton}>
        <Text style={stiller.butonText} onPress={() => navigation.navigate('KayitOl')}>Kayıt Ol</Text>
      </View>
    </View>
  );
}

function KayitOl({ navigation }) {
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [hataMesaji, setHataMesaji] = useState(null);

  const kayitOl = () => {
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, sifre)
      .then((userCredentials) => {
        if (userCredentials.user) {
          console.log('Kullanıcı kaydı başarılı:', email);
          firebase
            .database()
            .ref('kullanicilar/' + userCredentials.user.uid)
            .set({
              ad: ad,
              soyad: soyad,
              telefon: telefon,
            });
          navigation.navigate('AnaSayfa');
        }
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('Kullanıcı kaydı başarısız:', errorCode, errorMessage);
      });
  };

  return (
    <View style={stiller.kapsayici}>
      <Text>Kayıt Ol</Text>
      {hataMesaji && <Text style={{ color: 'red' }}>{hataMesaji}</Text>}
      <TextInput
        style={stiller.girisYapInput}
        placeholder="Ad"
        onChangeText={setAd}
        value={ad}
      />
      <TextInput
        style={stiller.girisYapInput}
        placeholder="Soyad"
        onChangeText={setSoyad}
        value={soyad}
      />
      <TextInput
        style={stiller.girisYapInput}
        placeholder="Telefon"
        onChangeText={setTelefon}
        value={telefon}
      />
      <TextInput
        style={stiller.girisYapInput}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        style={stiller.girisYapInput}
        placeholder="Şifre"
        onChangeText={setSifre}
        value={sifre}
        secureTextEntry
      />
      <Button title="Kayıt Ol" onPress={kayitOl} />
      <Button
        title="Giriş Yap"
        onPress={() => navigation.navigate('GirisYap')}
      />
    </View>
  );
}

function DudukCal() {
    const [ses, setSes] = useState();
  
    async function sesCal() {
      console.log('Ses yükleniyor');
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/duduk.mp3')
      );
      setSes(sound);
  
      console.log('Ses çalınıyor');
      await sound.playAsync();
    }
  
    useEffect(() => {
      return ses
        ? () => {
            console.log('Ses boşaltılıyor');
            ses.unloadAsync();
          }
        : undefined;
    }, [ses]);
  
    return (
      <View style={stiller.kapsayici}>
        <Text>Düdük Çal Butonu Sayfası</Text>
        <Button title="Düdük Çal" onPress={sesCal} />
      </View>
    );
  }

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="GirisYap">
        <Stack.Screen name="AnaSayfa" component={AnaSayfa} />
        <Stack.Screen name="GirisYap" component={GirisYap} />
        <Stack.Screen name="KayitOl" component={KayitOl} />
        <Stack.Screen name="KonumPaylasim" component={KonumPaylasim} />
       
        <Stack.Screen name="DudukCal" component={DudukCal} />
        <Stack.Screen name="KullaniciBilgileri" component={KullaniciBilgileri} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
const stiller = StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Açık gri bir arka plan rengi
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  harita: {
    width: "100%",
    height: '70%',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 20,
  },
  girisYapInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
    width: '80%',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buton: {
    backgroundColor: '#4CAF50', // Yeşil renk
    padding: 10,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
  },
  butonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  iconButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  icon: {
    width: 110,
    height: 110,
  },
});