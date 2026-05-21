/* === MATKA HAWELI — Script === */

// ── Ember Particles ──
(function(){
  const c=document.getElementById('ember-container');if(!c)return;
  for(let i=0;i<25;i++){
    const e=document.createElement('div');e.classList.add('ember');
    e.style.left=Math.random()*100+'%';
    e.style.animationDuration=(Math.random()*8+6)+'s';
    e.style.animationDelay=(Math.random()*12)+'s';
    const s=Math.random()*3+2;e.style.width=s+'px';e.style.height=s+'px';
    const colors=['rgba(212,163,73,.8)','rgba(232,115,26,.7)','rgba(255,107,53,.6)','rgba(240,212,138,.9)'];
    e.style.background=colors[Math.floor(Math.random()*colors.length)];
    c.appendChild(e);
  }
})();

// ── Navbar ──
(function(){
  const nav=document.getElementById('navbar');
  const ham=document.getElementById('hamburger');
  const links=document.getElementById('navLinks');
  if(!nav)return;

  window.addEventListener('scroll',()=>{
    nav.classList.toggle('scrolled',window.scrollY>50);
  });

  if(ham&&links){
    ham.addEventListener('click',()=>{
      links.classList.toggle('open');
      ham.classList.toggle('active');
    });
    links.querySelectorAll('.nav-link').forEach(l=>{
      l.addEventListener('click',()=>{links.classList.remove('open');ham.classList.remove('active')});
    });
  }

  // Active link highlight
  const sections=document.querySelectorAll('section[id]');
  window.addEventListener('scroll',()=>{
    const y=window.scrollY+160;
    sections.forEach(s=>{
      const t=s.offsetTop,h=s.offsetHeight,id=s.getAttribute('id');
      const link=document.querySelector(`.nav-link[href="#${id}"]`);
      if(link){
        if(y>=t&&y<t+h){
          document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  });
})();

// ── Scroll Animations ──
(function(){
  const els=document.querySelectorAll('[data-scroll]');
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const delay=e.target.getAttribute('data-delay')||0;
        setTimeout(()=>{
          e.target.classList.add('visible');
          // Stagger menu items inside this element
          const items=e.target.querySelectorAll('.mi');
          items.forEach((item,i)=>{
            item.style.opacity='0';
            item.style.transform='translateX(-20px)';
            item.style.transition='opacity .4s ease, transform .4s ease';
            setTimeout(()=>{
              item.style.opacity='1';
              item.style.transform='translateX(0)';
            },(i+1)*60);
          });
        },parseInt(delay));
        obs.unobserve(e.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -40px 0px'});
  els.forEach(el=>obs.observe(el));
})();

// ── Menu Tab Filtering ──
(function(){
  const tabs=document.querySelectorAll('.menu-tab');
  const cats=document.querySelectorAll('.menu-category');
  if(!tabs.length||!cats.length)return;

  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      // Update active tab
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');

      const cat=tab.dataset.cat;
      cats.forEach(c=>{
        if(cat==='all'||c.dataset.category===cat){
          c.classList.remove('hidden');
          c.style.opacity='0';
          c.style.transform='translateY(20px)';
          requestAnimationFrame(()=>{
            c.style.transition='opacity .5s ease, transform .5s ease';
            c.style.opacity='1';
            c.style.transform='translateY(0)';
          });
          // Re-stagger items
          const items=c.querySelectorAll('.mi');
          items.forEach((item,i)=>{
            item.style.opacity='0';
            item.style.transform='translateX(-20px)';
            setTimeout(()=>{
              item.style.opacity='1';
              item.style.transform='translateX(0)';
            },(i+1)*50+200);
          });
        } else {
          c.classList.add('hidden');
        }
      });
    });
  });
})();

// ── Counter Animation ──
(function(){
  const nums=document.querySelectorAll('[data-count]');
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const el=e.target,target=parseInt(el.dataset.count),dur=2000,start=performance.now();
        function tick(now){
          const p=Math.min((now-start)/dur,1);
          el.textContent=Math.floor(target*(1-Math.pow(1-p,3)));
          if(p<1)requestAnimationFrame(tick);else el.textContent=target;
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      }
    });
  },{threshold:.5});
  nums.forEach(n=>obs.observe(n));
})();

// ── Smooth Scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',function(e){
    const t=document.querySelector(this.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}
  });
});

// ── Parallax Hero ──
(function(){
  const h=document.querySelector('.hero-content');
  const bg=document.querySelector('.fire-image');
  if(!h)return;
  window.addEventListener('scroll',()=>{
    const s=window.scrollY;
    if(s<window.innerHeight){
      h.style.transform=`translateY(${s*.2}px)`;
      h.style.opacity=1-(s/window.innerHeight)*.6;
      if(bg)bg.style.transform=`scale(${1+s*.0003})`;
    }
  });
})();

// ── Form Handler ──
(function(){
  const form=document.getElementById('reservationForm');
  if(!form)return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const btn=form.querySelector('button[type="submit"]');
    const orig=btn.innerHTML;
    btn.innerHTML='<span>✓ RESERVATION CONFIRMED!</span>';
    btn.style.background='linear-gradient(135deg,#27ae60,#2ecc71)';
    btn.style.pointerEvents='none';
    setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';btn.style.pointerEvents='';form.reset()},3000);
  });
})();
