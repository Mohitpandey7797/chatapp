import { Box, Button, Container, VStack, Input, HStack } from "@chakra-ui/react"
import Message from "./Components/Message";
import { onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { app } from "./firebase";
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot,query,orderBy } from "firebase/firestore"
import React, { useRef, useState, useEffect } from "react";


const auth = getAuth(app)
const db = getFirestore(app)
const loginHandler = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === "auth/cancelled-popup-request") {
      alert("You closed the sign-in window. Please try again.");
    } else {
      // Handle other errors
    }
  }
};

const logoutHandler = () => signOut(auth)



function App() {
  const q = query(collection(db,"Messages"),orderBy("createdAt","asc"))
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])

  const divForScroll = useRef(null)

  const submitHandler = async (e) => {
    e.preventDefault()

    try {
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp()
      });
      setMessage("")
      divForScroll.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert(error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data)

    })
    const unsubscribeForMessage = onSnapshot(q,(snap) => {

      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      )

    });
    return () => {
      unsubscribe();
      unsubscribeForMessage();
    }
  },[]);
  return (
    <Box backgroundImage="url('https://plus.unsplash.com/premium_photo-1701090940014-320b715b5a8c?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Z3JheSUyMGJhY2tncm91bmR8ZW58MHx8MHx8fDA%3D')"
    backgroundSize="cover"
    backgroundPosition="center">
      {
        user ? (
          <Container h="100vh"
          backgroundImage="url('https://e0.pxfuel.com/wallpapers/875/426/desktop-wallpaper-i-whatsapp-background-chat-whatsapp-graffiti.jpg')"
          backgroundSize="cover"
          backgroundPosition="center">
            <VStack h="full" paddingY={"4"}>
              
              <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>
                Logout
              </Button>

              <VStack h={"full"} w={"full"} overflowY={"auto"} css={{"&::-webkit-scrollbar":{
                display:"none"
              }}} >
                {
                  messages.map(item => (
                    <Message
                      key={item.id}
                      user={item.uid === user.uid ? "me" : "other"}
                      text={item.text}
                      uri={item.uri}
                    />
                  ))
                }
                <div ref={divForScroll}></div>
              </VStack>

              

              <form onSubmit={submitHandler} style={{ width: "100%" }}>

                <HStack>
                  <Input  bg="white" color="black" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter a Messsage..." />
                  <Button colorScheme={"purple"} type="submit">Send</Button>
                </HStack>



              </form>
            </VStack>
          </Container>
        ) : <VStack h={"100vh"} bg={"white"} justifyContent={"center"}>
          <Button onClick={loginHandler} color={"purple"}>Sign In With Google</Button>
        </VStack>
      }
    </Box>
  );
}

export default App;
