import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

import Header from '../../components/Header';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

function calculateReadingTime(post: Post): number{

  //definindo a quantidade de palavras aproximada quem uma pessoa fala por min
  const wordsPersonSpeakMinute = 200;

  //fazendo a contagem de palavras
  const wordsCount = RichText.asText(
    post.data.content.reduce((total, contentWord) => [...total, ...contentWord.body], [])
  ).split(' ').length + RichText.asText(
    post.data.content.reduce((total, contentWord) => {
      if (contentWord.heading) {
        return [...total, ...contentWord.heading.split(' ')];
      }
      return [...total]
    }, [])
  ).split(' ').length;

  //realizando arredondamento através do ceil
  const totalTimeToReading = Math.ceil(wordsCount / wordsPersonSpeakMinute);

  return totalTimeToReading;
}

export default function Post({ post }: PostProps): JSX.Element {

  // const totalWords = post.data.content.reduce((total, contentItem) => {
  //   total += contentItem.heading.split(' ').length;

  //   const words = contentItem.body.map(item => item.text.split(' ').length);
  //   words.map(word => (total += word));
  //   return total;
  // }, 0);

  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title> Aguarde... | spacetraveling</title>
        </Head>

        <main className={commonStyles.pageContainer}>
          <span className={styles.loadingNotification}>Carregando...</span>
        </main>
      </>
    );
  }

  const timeToRead = calculateReadingTime(post);

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR
    }
  )


  return(
    <>
      <Head>
        <title>{`${post.data.title} | spacetraveling`}</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt="imagem" className={styles.banner} />
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <div className={styles.postTop}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar />
                {formatedDate}
              </li>
              <li>
                <FiUser />
                {post.data.author}
              </li>
              <li>
                <FiClock />
                {`${timeToRead} min`}
              </li>
            </ul>
          </div>

          {
            post.data.content.map(content => {
              return (
                <article key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div 
                    className={styles.postContent}
                    dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
                  />
                </article>
              )
            })
          }
          
        </div>

      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type','posts')
  ]);

  /* 
    - através do posts.results conseguimos trazer todos os nossos posts
    - será feito um map, para pegar cada post e retornando um object,
    que é o que o next solicita

  */
  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return { 
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [
            ...content.body
          ]
        }
      })
    }
  }

  return {
    props: {
      post
    },
    revalidate: 1800
  }
};
