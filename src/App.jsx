import { useState, useEffect } from 'react';
import { initializeApp } from 'firebaseapp';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebaseauth';
import { getFirestore, collection, onSnapshot, doc, getDoc, addDoc } from 'firebasefirestore';

 Main App Component
const App = () = {
   Firebase state variables
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadPassword, setUploadPassword] = useState('');

   Constants from the environment
  const appId = typeof __app_id !== 'undefined'  __app_id  'default-app-id';
   Reverting to the environment-provided Firebase configuration to fix authentication errors
  const firebaseConfig = typeof __firebase_config !== 'undefined'  JSON.parse(__firebase_config)  {};
  const initialAuthToken = typeof __initial_auth_token !== 'undefined'  __initial_auth_token  null;

  console.log(Using Firebase Config, firebaseConfig);
  console.log(Initial Auth Token, initialAuthToken);


   1. Initialize Firebase and handle authentication
  useEffect(() = {
    const initializeFirebase = async () = {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authService = getAuth(app);
        
        setDb(firestore);
        setAuth(authService);

         Sign in using the provided token or anonymously
        if (initialAuthToken) {
          await signInWithCustomToken(authService, initialAuthToken);
        } else {
          await signInAnonymously(authService);
        }

         Listen for auth state changes
        onAuthStateChanged(authService, (user) = {
          if (user) {
            setUserId(user.uid);
          } else {
             Use a random ID for anonymous users if not signed in
            setUserId(crypto.randomUUID());
          }
          setIsAuthReady(true);
        });
        
      } catch (error) {
        console.error(Error initializing Firebase, error);
      }
    };
    initializeFirebase();
  }, []);  Run only once on component mount

   2. Fetch photos from Firestore once authentication is ready
  useEffect(() = {
    if (isAuthReady && db) {
       Define the path for the public photo collection
      const photoCollectionPath = `artifacts${appId}publicdataweddingPhotos`;
      const q = collection(db, photoCollectionPath);
      
       Listen for real-time updates to the photos
      const unsubscribe = onSnapshot(q, (querySnapshot) = {
        const fetchedPhotos = [];
        querySnapshot.forEach((doc) = {
          fetchedPhotos.push({ id doc.id, ...doc.data() });
        });
        setPhotos(fetchedPhotos);
      }, (error) = {
        console.error(Error fetching photos, error);
      });

       Cleanup listener on component unmount
      return () = unsubscribe();
    }
  }, [isAuthReady, db, appId]);  Depend on auth readiness and db instance

   Handler for file upload
  const handlePhotoUpload = async (e) = {
    e.preventDefault();
    if (!db  !userId) {
      setUploadMessage('Error Firebase not initialized or user not authenticated.');
      return;
    }

     Check for password
    if (uploadPassword !== 'sunshine') {
      setUploadMessage('Incorrect password. Please try again.');
      return;
    }

    const photoFile = e.target.elements.photoFile.files[0];
    const guestName = e.target.elements.guestName.value  'Anonymous';

    if (!photoFile) {
      setUploadMessage('Please select a photo to upload.');
      return;
    }

    setIsLoading(true);
    setUploadMessage('');

    try {
       In a real app, you would upload the image to Firebase Storage first
       and get a download URL. For this example, we'll use a placeholder.
      
       Example of real-world upload flow (pseudo-code)
       const storageRef = ref(storage, `photos${photoFile.name}`);
       await uploadBytes(storageRef, photoFile);
       const downloadURL = await getDownloadURL(storageRef);
      
       For this example, we use a placeholder image.
      const placeholderUrl = `httpsplacehold.co600x400808080FFFFFFtext=Photo+from+${guestName}`;

       Add a new document to the photos collection
      const docRef = await addDoc(collection(db, `artifacts${appId}publicdataweddingPhotos`), {
        url placeholderUrl,
        guestName guestName,
        uploadedAt new Date().toISOString(),
         Save the full userId for other users to see who uploaded it
        userId userId, 
      });

      setUploadMessage('Photo uploaded successfully!');
    } catch (error) {
      console.error(Error uploading photo, error);
      setUploadMessage('Failed to upload photo. Please try again.');
    } finally {
      setIsLoading(false);
      e.target.reset();  Clear the form
      setUploadPassword('');  Clear the password field
    }
  };

   The main UI of the wedding website
  return (
    div className=bg-[url('httpsplacehold.co1920x1080b9bfd8fffffftext=Elegant+Wedding+Background')] bg-fixed bg-cover bg-center text-[#333] font-inter min-h-screen
      
      { User ID Display - Mandatory for multi-user apps }
      {userId && (
        div className=fixed top-2 left-2 text-xs bg-gray-200 p-2 rounded-lg shadow-sm z-50
          Your User ID span className=font-mono break-all{userId}span
        div
      )}

      { Hero Section }
      section id=hero className=relative h-screen flex flex-col items-center justify-center text-white text-center p-8
        div className=absolute inset-0 bg-black opacity-40div
        div className=relative z-10 space-y-4
          h1 className=text-4xl smtext-6xl mdtext-7xl font-semibold font-serif leading-tight
            Talesa & Simon
          h1
          p className=text-lg smtext-xl font-light
            27th September 2025
          p
        div
      section

      { Welcome Section }
      section id=welcome className=py-16 smpy-24 px-4 smpx-8 mdpx-16 flex flex-col mdflex-row items-center justify-center gap-8 mdgap-16 bg-[#fcfaf7]80 backdrop-blur-sm
        div className=w-full mdw-12 flex justify-center
          img
            src=httpsplacehold.co600x600b8b8b8ffftext=Welcome+Image
            alt=Welcome
            className=rounded-xl shadow-lg w-full max-w-sm smmax-w-md object-cover
          
        div
        div className=w-full mdw-12 text-center mdtext-left space-y-4
          h2 className=text-3xl smtext-4xl font-semibold font-serif text-[#555]Welcome!h2
          p className=text-base smtext-lg text-gray-700
            We are so excited to welcome you to Gibraltar for our wedding. Whether you're travelling near or far, thank you for making the journey to celebrate this special day with us.
          p
          p className=text-base smtext-lg text-gray-700
            We've planned a relaxed, joyful day filled with sunshine, laughter, and a bit of sparkle - and we can't wait to share it all with you.
          p
          p className=text-base smtext-lg font-bold pt-4 text-[#555]With love,br Tally & Simonp
        div
      section

      { The Ceremony Section }
      section id=ceremony className=py-16 smpy-24 px-4 smpx-8 mdpx-16 flex flex-col mdflex-row-reverse items-center justify-center gap-8 mdgap-16 bg-[#e9e4d9]80 backdrop-blur-sm
        div className=w-full mdw-12 flex justify-center
          img
            src=httpsplacehold.co600x600b8b8b8ffftext=Ceremony+Image
            alt=The Ceremony
            className=rounded-xl shadow-lg w-full max-w-sm smmax-w-md object-cover
          
        div
        div className=w-full mdw-12 text-center mdtext-left space-y-4
          h2 className=text-3xl smtext-4xl font-semibold font-serif text-[#555]The Ceremonyh2
          p className=text-base smtext-lg font-bold text-gray-800200 PM - Ceremonyp
          p className=text-base smtext-lg text-gray-700
            The Dell, Gibraltar Botanic Gardens. Please arrive by 145 PM. The ceremony will be held outdoors, surrounded by the lush greenery of the gardens. Light refreshments will follow.
          p
        div
      section

      { The Reception Section }
      section id=reception className=py-16 smpy-24 px-4 smpx-8 mdpx-16 flex flex-col mdflex-row items-center justify-center gap-8 mdgap-16 bg-[#fcfaf7]80 backdrop-blur-sm
        div className=w-full mdw-12 flex justify-center
          img
            src=httpsplacehold.co600x600b8b8b8ffftext=Reception+Image
            alt=The Reception
            className=rounded-xl shadow-lg w-full max-w-sm smmax-w-md object-cover
          
        div
        div className=w-full mdw-12 text-center mdtext-left space-y-4
          h2 className=text-3xl smtext-4xl font-semibold font-serif text-[#555]The Receptionh2
          div className=space-y-2
            p className=text-base smtext-lg font-bold text-gray-8001700 - Welcome Drinksp
            p className=text-base smtext-lg font-bold text-gray-8001800 - Dinner Servicep
            p className=text-base smtext-lg font-bold text-gray-8002000 - Late - Drinks, Dancing & Mischiefp
          div
          p className=text-base smtext-lg text-gray-700
            Join us at the Wheel House, Sunborn Yacht Hotel. We'll start with welcome drinks, followed by a seasonal Mediterranean dinner and toasts. The dance floor is officially open from 8 PM!
          p
        div
      section

      { Drinks & Food Section }
      section id=drinks-food className=py-16 smpy-24 px-4 smpx-8 mdpx-16 flex flex-col mdflex-row-reverse items-center justify-center gap-8 mdgap-16 bg-[#e9e4d9]80 backdrop-blur-sm
        div className=w-full mdw-12 flex justify-center
          img
            src=httpsplacehold.co600x600b8b8b8ffftext=Food+and+Drink+Image
            alt=Drinks and Food
            className=rounded-xl shadow-lg w-full max-w-sm smmax-w-md object-cover
          
        div
        div className=w-full mdw-12 text-center mdtext-left space-y-6
          h2 className=text-3xl smtext-4xl font-semibold font-serif text-[#555]Food & Drinkh2
          div className=space-y-4
            div
              h3 className=text-xl smtext-2xl font-bold font-serif text-gray-800Startersh3
              p className=text-base smtext-lg text-gray-700Gibraltar garden salad & Gibraltar bay platterp
            div
            div
              h3 className=text-xl smtext-2xl font-bold font-serif text-gray-800Mainh3
              p className=text-base smtext-lg text-gray-700Upper rock herb-crusted rack of lamb & Europa point spinach and ricotta cannellonip
            div
            div
              h3 className=text-xl smtext-2xl font-bold font-serif text-gray-800Dessertsh3
              p className=text-base smtext-lg text-gray-700White chocolate brownie tiramisu & Sunset Triop
            div
            div
              h3 className=text-xl smtext-2xl font-bold font-serif text-gray-800Drinksh3
              p className=text-base smtext-lg text-gray-700A wide selection of house wines, cava, beers, spirits, and two signature cocktails.p
            div
          div
        div
      section

      { Photo Gallery & Upload Section }
      section id=gallery className=py-16 smpy-24 px-4 smpx-8 mdpx-16 bg-[#fcfaf7]80 backdrop-blur-sm
        div className=max-w-5xl mx-auto space-y-12
          h2 className=text-4xl smtext-5xl font-semibold font-serif text-center text-[#555] mb-8Guest Photo Galleryh2

          { Upload Form }
          div className=bg-gray-10090 p-8 rounded-xl shadow-lg
            h3 className=text-2xl font-bold text-center text-[#555] mb-6Upload Your Photosh3
            form onSubmit={handlePhotoUpload} className=space-y-4
              div className=flex flex-col smflex-row items-center gap-4
                input
                  type=text
                  name=guestName
                  placeholder=Your Name (Optional)
                  className=w-full smw-13 p-3 border border-gray-300 rounded-md focusoutline-none focusring-2 focusring-[#8c8266]
                
                input
                  type=password
                  name=password
                  placeholder=Password
                  required
                  value={uploadPassword}
                  onChange={(e) = setUploadPassword(e.target.value)}
                  className=w-full smw-13 p-3 border border-gray-300 rounded-md focusoutline-none focusring-2 focusring-[#8c8266]
                
                input
                  type=file
                  name=photoFile
                  accept=image
                  required
                  className=w-full smw-13 p-3 border border-gray-300 rounded-md bg-white filemr-4 filepy-2 filepx-4 filerounded-full fileborder-0 filetext-sm filefont-semibold filebg-rose-50 filetext-rose-700 hoverfilebg-rose-100
                
              div
              button
                type=submit
                disabled={isLoading  !db}
                className=w-full bg-[#8c8266] text-white py-3 rounded-md font-semibold hoverbg-[#6c6450] transition-colors duration-300 disabledopacity-50 disabledcursor-not-allowed
              
                {isLoading  'Uploading...'  'Upload Photo'}
              button
            form
            {uploadMessage && (
              p className=mt-4 text-center text-sm font-semibold text-gray-600{uploadMessage}p
            )}
            {!db && (
              p className=mt-4 text-center text-sm font-semibold text-red-600Loading Firebase... Please wait.p
            )}
          div

          { Photo Grid }
          div className=grid grid-cols-1 smgrid-cols-2 mdgrid-cols-3 lggrid-cols-4 gap-6 mt-10
            {photos.length  0  (
              photos.map((photo) = (
                div key={photo.id} className=relative group overflow-hidden rounded-xl shadow-lg
                  img
                    src={photo.url}
                    alt={`Uploaded by ${photo.guestName}`}
                    className=w-full h-auto transform transition-transform duration-300 group-hoverscale-105
                  
                  div className=absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hoveropacity-100 transition-opacity duration-300
                    p className=text-white text-center font-semibold text-lg p-2
                      {photo.guestName}
                    p
                  div
                div
              ))
            )  (
              p className=col-span-full text-center text-gray-500
                Be the first to upload a photo!
              p
            )}
          div
        div
      section

      { Footer }
      footer className=bg-[#333] text-white text-center py-6
        p className=text-sm&copy; 2025 Talesa & Simon. All rights reserved.p
      footer
    div
  );
};

export default App;
