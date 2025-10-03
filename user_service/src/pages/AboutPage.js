import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AdLayout } from '../components/ads';

// Inline styles for the page
const styles = {
  pageContainer: {
    backgroundColor: '#f8f9fa',
    color: '#333',
    fontFamily: 'Arial, sans-serif',
    lineHeight: 1.6,
  },
  mainContent: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '50px',
  },
  mainTitle: {
    fontSize: '3em',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  subTitle: {
    fontSize: '1.5em',
    color: '#3498db',
  },
  section: {
    marginBottom: '50px',
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '2em',
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: '20px',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
  },
  featureList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  featureItem: {
    padding: '20px',
    border: '1px solid #ecf0f1',
    borderRadius: '5px',
    backgroundColor: '#fdfdfd',
  },
  featureTitle: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  diagramContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    flexWrap: 'wrap',
  },
  diagramBox: {
    padding: '15px 25px',
    margin: '10px',
    backgroundColor: '#ecf0f1',
    border: '1px solid #bdc3c7',
    borderRadius: '5px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  diagramArrow: {
    fontSize: '2em',
    color: '#3498db',
    margin: '0 10px',
  },
};

const AboutPage = () => {
  return (
    <div style={styles.pageContainer}>
      <Header />
      <AdLayout>
        <div style={styles.mainContent}>
          <header style={styles.header}>
            <h1 style={styles.mainTitle}>PolRadar</h1>
            <p style={styles.subTitle}>당신의 손 안의 정치 나침반</p>
          </header>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>우리의 미션</h2>
            <p>
              PolRadar는 쏟아지는 정치 정보의 홍수 속에서 길을 잃지 않도록 돕는 명확한 나침반이 되고자 합니다. 복잡한 정치를 명확하게 분석하고, 시민의 목소리가 더 큰 의미를 갖도록 만드는 것, 그것이 PolRadar의 존재 이유입니다.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>주요 기능: PolRadar는 이렇게 다릅니다</h2>
            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <h3 style={styles.featureTitle}>🤖 AI 뉴스 분석</h3>
                <p>AI가 매일 쏟아지는 뉴스를 요약하고, 사실 관계와 편향성을 분석하여 핵심 정보만을 제공합니다.</p>
              </div>
              <div style={styles.featureItem}>
                <h3 style={styles.featureTitle}>📜 잠자는 법안 추적</h3>
                <p>발의만 되고 잊히는 수많은 법안들의 처리 과정을 끝까지 추적하여, 우리 삶에 영향을 미칠 중요한 법안을 놓치지 않도록 돕습니다.</p>
              </div>
              <div style={styles.featureItem}>
                <h3 style={styles.featureTitle}>👥 이슈/인물 중심 큐레이션</h3>
                <p>특정 정당, 정치인, 또는 사회적 이슈와 관련된 뉴스와 법안 정보를 한눈에 모아볼 수 있습니다.</p>
              </div>
              <div style={styles.featureItem}>
                <h3 style={styles.featureTitle}>🔗 뉴스-법안 자동 연결</h3>
                <p>뉴스 기사에서 언급된 정책이나 주제가 어떤 법안과 관련 있는지 AI가 자동으로 연결하여 정보의 맥락을 파악하게 합니다.</p>
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>PolRadar 이용 방법: 정보에서 참여까지</h2>
            <p>PolRadar는 단순한 정보 제공을 넘어, 시민의 참여를 이끌어내는 것을 목표로 합니다.</p>
            <div style={styles.diagramContainer}>
              <div style={styles.diagramBox}>뉴스 확인</div>
              <div style={styles.diagramArrow}>→</div>
              <div style={styles.diagramBox}>관련 법안 발견</div>
              <div style={styles.diagramArrow}>→</div>
              <div style={styles.diagramBox}>법안 내용 및<br/>발의자 파악</div>
              <div style={styles.diagramArrow}>→</div>
              <div style={styles.diagramBox}>의견 제시 및<br/>토론 참여</div>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>우리의 비전</h2>
            <p>
              PolRadar는 건강한 정치 생태계를 위한 작은 시작입니다. 시민 개개인의 관심과 참여가 모일 때, 정치는 더 나은 방향으로 나아갈 수 있다고 믿습니다. 저희는 그 과정을 돕는 가장 유용한 도구가 되겠습니다.
            </p>
          </section>
        </div>
      </AdLayout>
      <Footer />
    </div>
  );
};

export default AboutPage;
