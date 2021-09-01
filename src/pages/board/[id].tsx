import { GetServerSideProps } from "next"
import { getSession } from "next-auth/client"
import firebase from '../../config/firebaseConnection';
import { format } from 'date-fns';

import Head from 'next/head';
import styles from './task.module.scss';
import { FiCalendar } from 'react-icons/fi'

interface ITask {
  id: string;
  createdAt: string | Date;
  createdAtFormated?: string;
  taskName: string;
  userId: string;
  name: string;
}

interface TaskListProps{
  data: string;
}

export default function Task({ data }: TaskListProps){
  const task = JSON.parse(data) as ITask;

  return(
    <>
    <Head>
      <title>Detalhes da sua tarefa</title>
    </Head>
    <article className={styles.container}>
      <div className={styles.actions}>
        <div>
          <FiCalendar size={30} color="#FFF"/>
          <span>Tarefa criada:</span>
          <time>{task.createdAtFormated}</time>
        </div>
      </div>    
      <p>{task.taskName}</p>  
    </article>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, params}) => {
  const { id } = params;
  const session = await getSession({ req });

  if(!session?.vip){
    return{
      redirect:{
        destination: '/board',
        permanent: false,
      }
    }
  }

  const data = await firebase.firestore().collection('tasks')
  .doc(String(id))
  .get()
  .then((snapshot)=>{
    const data = {
      id: snapshot.id,
      createdAt: snapshot.data().createdAt,
      createdAtFormated: format(snapshot.data().createdAt.toDate(), 'dd MMMM yyyy'),
      taskName: snapshot.data().taskName,
      userId: snapshot.data().userId,
      name: snapshot.data().name
    }

    return JSON.stringify(data);
  })
  .catch(()=>{
    return {};
  })

  if(Object.keys(data).length === 0){
    return{
      redirect:{
        destination: '/board',
        permanent: false,
      }
    }  
  }

  return{
    props:{
      data
    }
  }
}