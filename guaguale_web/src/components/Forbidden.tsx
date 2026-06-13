import './Forbidden.css';

function Forbidden() {
  return (
    <div className="forbidden-page">
      <div className="forbidden-icon">🚫</div>
      <h1 className="forbidden-title">禁止访问</h1>
      <p className="forbidden-desc">你没有权限访问此页面</p>
    </div>
  );
}

export default Forbidden;
