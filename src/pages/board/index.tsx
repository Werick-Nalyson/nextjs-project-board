import Head from 'next/head';
import { useState, FormEvent } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/client';
import { FiPlus, FiCalendar, FiEdit2, FiTrash, FiClock } from 'react-icons/fi'
import { format } from 'date-fns'

import styles from './styles.module.scss'
import { SupportButton } from '../../components/SupportButton';

import firebase from '../../config/firebaseConnection';
import Link from 'next/link';

interface ITaskList {
  id: string;
  createdAt: string | Date;
  createdAtFormated?: string;
  taskName: string;
  userId: string;
  name: string;
}


interface IBoardProps {
  user: {
    id: string;
    name: string;
  },
  data: string;
}

export default function Board({ user, data }: IBoardProps){
  const [textInput, setTextInput] = useState('')
  const [taskList, setTaskList] = useState<ITaskList[]>(JSON.parse(data))

  async function handleAddTask (e: FormEvent) {
    e.preventDefault()

    if(textInput === ''){
      alert('Preencha alguma tarefa!')
      return;
    }

    await firebase.firestore().collection('tasks')
    .add({
      createdAt: new Date(),
      taskName: textInput,
      userId: user.id,
      userName: user.name
    })
    .then((doc)=>{
      console.log('Nova task cadastrada!')

      let data = {
        id: doc.id,
        createdAt: new Date(),
        createdAtFormated: format(new Date(), 'dd MMMM yyyy'),
        taskName: textInput,
        userId: user.id,
        name: user.name
      };

      setTaskList([...taskList, data]);
      setTextInput('');
    })
    .catch((err)=>{
      console.log('ERRO AO CADASTRAR: ', err)
    })
  }

  return(
    <>
    <Head>
    	<title>Minhas tarefas - Board</title>
    </Head>
    <main className={styles.container}>
      <form onSubmit={handleAddTask}>
        <input 
          type="text" 
          placeholder="Digite sua tarefa..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
        <button type="submit">
          <FiPlus size={25} color="#17181f" />
        </button>
      </form>

    <h1>Você tem {taskList.length} {taskList.length === 1 ? 'Tarefa' : 'Tarefas'}!</h1>

    <section>
    {taskList.map( task => (
      <article key={task.id} className={styles.taskList}>
        <Link href={`/board/${task.id}`}>
            <p>{task.taskName}</p>
        </Link>
        <div className={styles.actions}>
          <div>
            <div>
              <FiCalendar size={20} color="#FFB800"/>
              <time>{task.createdAtFormated}</time>
            </div>
            <button>
              <FiEdit2 size={20} color="#FFF" />
              <span>Editar</span>
            </button>
          </div>

          <button>
            <FiTrash size={20} color="#FF3636" />
            <span>Excluir</span>
          </button>
        </div>
      </article>
      ))}
    </section>

    </main>

    <div className={styles.vipContainer}>
      <h3>Obrigado por apoiar esse projeto.</h3>
      <div>
        <FiClock size={28} color="#FFF" />
        <time>
          Última doação foi a 3 dias.
        </time>
      </div>
    </div>

    <SupportButton/>

    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })

  if (!session.id) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }

  const tasks = await firebase.firestore().collection('tasks')
  .where('userId', '==', session?.id)
  .orderBy('createdAt', 'asc').get();

  const data = JSON.stringify(tasks.docs.map( u => {
    return {
      id: u.id,
      createdAtFormated: format(u.data().createdAt.toDate(), 'dd MMMM yyyy'),
      ...u.data(),
    }
  }))

  const user = {
    id: session?.id,
    name: session?.user.name
  }

  return {
    props: {
      user,
      data
    }
  }
}