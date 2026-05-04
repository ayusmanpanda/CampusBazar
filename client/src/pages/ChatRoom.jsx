import { useParams } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow.jsx';

export default function ChatRoom() {
  const { id } = useParams();
  return <ChatWindow chatRoomId={id} />;
}
