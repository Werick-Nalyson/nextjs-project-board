import Head from 'next/head';
import { useState, FormEvent } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/client';
import { FiPlus, FiCalendar, FiEdit2, FiTrash, FiClock, FiX } from 'react-icons/fi'
import { format, formatDistance } from 'date-fns'
import { ptBR } from 'date-fns/locale';

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
  user:{
    id: string;
    name: string;
    vip: boolean;
    lastDonate: string | Date;
  }
  data: string;
}

export default function Board({ user, data }: IBoardProps){
  const [textInput, setTextInput] = useState('')
  const [taskList, setTaskList] = useState<ITaskList[]>(JSON.parse(data))

  const [taskEdit, setTaskEdit] = useState<ITaskList | null>(null)

  async function handleAddTask (e: FormEvent) {
    e.preventDefault()

    if(textInput === ''){
      alert('Preencha alguma tarefa!')
      return;
    }

    if(taskEdit){
      await firebase.firestore().collection('tasks')
      .doc(taskEdit.id)
      .update({
        taskName: textInput
      })
      .then(()=>{
        let data = taskList;
        let taskIndex = taskList.findIndex(item => item.id === taskEdit.id);
        data[taskIndex].taskName = textInput

        setTaskList(data);
        setTaskEdit(null);
        setTextInput('');

      })
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

  async function handleDelete(id: string){
    setTaskEdit(null);
    setTextInput('');
    
    await firebase.firestore().collection('tasks').doc(id)
    .delete()
    .then(()=>{
      console.log('DELETADO COM SUCESSO!');
      let taskDeleted = taskList.filter( item => {
        return (item.id !== id)
      });

      setTaskList(taskDeleted);
    })
    .catch((err)=>{
      console.log(err);
    })
  }

  function handleEditTask(task: ITaskList){
    setTaskEdit(task);
    setTextInput(task.taskName);
  }

  function handleCancelEdit(){
    setTextInput('');
    setTaskEdit(null);
  }

  return(
    <>
    <Head>
    	<title>Minhas tarefas - Board</title>
    </Head>

    <main className={styles.container}>
      {taskEdit && (
          <span className={styles.warnText}>
            <button onClick={ handleCancelEdit }>
            <FiX size={30} color="#FF3636" />
            </button>
            Você está editando uma tarefa!
          </span>
        )}
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
        {user.vip ? (
        <Link href={`/board/${task.id}`}>
          <a>
            <p>{task.taskName}</p>
          </a>
        </Link>
        ): (
          <p>{task.taskName}</p>
        )}
        <div className={styles.actions}>
          <div>
            <div>
              <FiCalendar size={20} color="#FFB800"/>
              <time>{task.createdAtFormated}</time>
            </div>
            {user.vip && (
            <button onClick={ () => handleEditTask(task) } >
              <FiEdit2 size={20} color="#FFF" />
              <span>Editar</span>
            </button>
            ) }
          </div>

          <button onClick={() => handleDelete(task.id)}>
            <FiTrash size={20} color="#FF3636" />
            <span>Excluir</span>
          </button>
        </div>
      </article>
      ))}
    </section>

    </main>

    {user.vip && (
    <div className={styles.vipContainer}>
      <h3>Obrigado por apoiar esse projeto.</h3>
      <div>
        <FiClock size={28} color="#FFF" />
        <time>
          Última doação foi {formatDistance(new Date(user.lastDonate), new Date(), { locale: ptBR} )}
        </time>
      </div>
    </div>
    )}

    <SupportButton/>

    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })

  if (!session?.id) {
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
    name: session?.user.name,
    vip: session?.vip,
    lastDonate: session?.lastDonate
  }

  return {
    props: {
      user,
      data
    }
  }
}